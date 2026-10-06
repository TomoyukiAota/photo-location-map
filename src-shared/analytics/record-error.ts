import { ProxyRequire } from '../require/proxy-require';
import { ErrorScrubbingContext, errorForAnalytics } from './error-for-analytics';

// Records errors that nothing handled, without the user's file paths (see errorForAnalytics).
// An error in a loop must not flood analytics, so each process sends at most 20 errors per launch, and at most 3
// with the same message. Recording never throws: it runs while handling another error.
const maxErrorsPerLaunch = 20;
const maxErrorsWithSameLabel = 3;

let recordedErrors = 0;
const recordedLabels = new Map<string, number>();
const recordedErrorObjects = new WeakSet<object>();
let isRecording = false;

export function recordUnhandledError(error: unknown, processName: 'Main' | 'Renderer'): void {
  if (isRecording || recordedErrors >= maxErrorsPerLaunch)
    return;

  isRecording = true;
  try {
    // In the renderer, an unhandled promise rejection reaches both Angular's ErrorHandler (wrapped by zone.js)
    // and the window's unhandledrejection listener, so the same error is recorded once.
    const original = unwrapPromiseRejection(error);
    if (typeof original === 'object' && original !== null) {
      if (recordedErrorObjects.has(original))
        return;
      recordedErrorObjects.add(original);
    }

    const { label, value } = errorForAnalytics(original, scrubbingContext());
    const sameLabel = recordedLabels.get(label) || 0;
    if (sameLabel >= maxErrorsWithSameLabel)
      return;

    recordedLabels.set(label, sameLabel + 1);
    recordedErrors++;
    // Required here, not imported at the top: this file is loaded first in the main process (to catch errors
    // from the start), and importing Analytics there would initialize analytics earlier than before.
    const { Analytics } = require('./analytics') as typeof import('./analytics');
    Analytics.trackEvent('Unhandled Error', `Unhandled Error (${processName})`, label, value);
  } catch {
    // Nothing more can be done here.
  } finally {
    isRecording = false;
  }
}

/** Records an error message that is not an exception, such as an auto-update failure, without paths. */
export function scrubbedErrorLabel(error: unknown): string {
  return errorForAnalytics(error, scrubbingContext()).label;
}

/** zone.js wraps an unhandled promise rejection in an Error "Uncaught (in promise): …" with the reason in `rejection`. */
function unwrapPromiseRejection(error: unknown): unknown {
  return error instanceof Error && 'rejection' in error ? (error as Error & { rejection: unknown }).rejection : error;
}

function scrubbingContext(): ErrorScrubbingContext {
  const os = ProxyRequire.os;
  const appPaths: string[] = [];
  const electronApp = ProxyRequire.electron?.app;  // Only in the main process.
  if (electronApp)
    appPaths.push(electronApp.getAppPath());
  return {
    appPaths,
    sensitiveStrings: os ? [os.homedir(), os.userInfo().username] : [],
  };
}
