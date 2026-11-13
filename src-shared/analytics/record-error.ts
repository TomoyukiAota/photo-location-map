import { startupMetadata } from '../startup/startup-metadata';
import { ErrorScrubbingContext, errorForAnalytics, maxLabelLength, scrubMessage } from './error-for-analytics';
import { EventLimiter } from './event-limiter';

// Records errors that nothing handled, without the user's file paths (see errorForAnalytics).
// An error in a loop must not flood analytics, so each process sends at most 20 errors per launch, and at most 3
// with the same message; what the limits drop is counted (event-limiter.ts). Recording never throws: it runs while
// handling another error.
const unhandledErrors = new EventLimiter('Unhandled Error', 20, 3);

const recordedErrorObjects = new WeakSet<object>();
let isRecording = false;

/** Records an error that nothing handled, once for each error object and within the limits above. */
export function recordUnhandledError(error: unknown, processName: 'Main' | 'Renderer'): void {
  if (isRecording)
    return;

  isRecording = true;
  try {
    // The same error object is recorded once, however many handlers report it.
    const original = unwrapPromiseRejection(error);
    if (typeof original === 'object' && original !== null) {
      if (recordedErrorObjects.has(original))
        return;
      recordedErrorObjects.add(original);
    }

    // Past the limit of the launch, the error is counted without the work of describing it.
    if (unhandledErrors.isFull) {
      unhandledErrors.drop();
      return;
    }
    const { label, value } = errorForAnalytics(original, scrubbingContext());
    if (!unhandledErrors.allows(label))
      return;

    // Required here, not imported at the top: this file is loaded first in the main process (to catch errors
    // from the start), and importing Analytics there would initialize analytics earlier than before.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- See above.
    const { Analytics } = require('./analytics') as typeof import('./analytics');
    Analytics.trackEvent('Unhandled Error', `Unhandled Error (${processName})`, label, value);
  } catch {
    // Nothing more can be done here.
  } finally {
    isRecording = false;
  }
}

/** An error's label and value as an unhandled error's are, without paths, for an event of its own. */
export function scrubbedError(error: unknown): { label: string, value: string } {
  return errorForAnalytics(error, scrubbingContext());
}

/** Records an error message that is not an exception, such as an auto-update failure, without paths. */
export function scrubbedErrorLabel(error: unknown): string {
  return errorForAnalytics(error, scrubbingContext()).label;
}

/** Text that describes an error, such as one a worker process sent as text, without paths. */
export function scrubbedErrorText(text: string): string {
  return scrubMessage(text, scrubbingContext()).slice(0, maxLabelLength);
}

/**
 * An error "Uncaught (in promise): …" with the reason in `rejection`, as zone.js made of an unhandled promise rejection,
 * stands for its reason. The renderer no longer loads zone.js, so its rejections reach recordUnhandledError unwrapped.
 */
function unwrapPromiseRejection(error: unknown): unknown {
  return error instanceof Error && 'rejection' in error ? (error as Error & { rejection: unknown }).rejection : error;
}

let mainProcessContext: (() => ErrorScrubbingContext) | undefined;

/**
 * Sets what the main process's errors are scrubbed of: the app's own folder, the home folder and the user name.
 * src-main/analytics/ sets it before anything else is imported, as an error can be recorded from the start.
 */
export function setScrubbingContext(context: () => ErrorScrubbingContext): void {
  mainProcessContext = context;
}

/** What errors are scrubbed of: in a renderer, the home folder and the user name that the main process sent. */
export function scrubbingContext(): ErrorScrubbingContext {
  if (mainProcessContext)
    return mainProcessContext();
  try {
    const { homeDir, userName } = startupMetadata();
    return { appPaths: [], sensitiveStrings: [homeDir, userName].filter(Boolean) };
  } catch {
    return { appPaths: [], sensitiveStrings: [] };  // Not in Electron, as in Vitest.
  }
}
