import { LoggedLine } from '../log/logged-line.js';
import { Analytics } from './analytics.js';
import { ErrorScrubbingContext, errorForAnalytics, maxLabelLength, scrubMessage } from './error-for-analytics.js';
import { EventLimiter } from './event-limiter.js';
import { scrubbingContext } from './record-error.js';

// TL;DR: Records the errors and warnings that the code logs, as "Logged Error" and "Logged Warning".
// Details: About a hundred places catch an error, log it and go on; until these events, such a failure was only in the
// log file on the user's computer. A line is recorded as src-shared/log/logged-line.ts says, without the values that
// could name the user's files, and each kind has its own limits (event-limiter.ts), so that a flood of warnings does
// not use up the errors'. Each process sets this as its logger's line recorder (useLineRecorder).

const limiters = {
  error: new EventLimiter('Logged Error', 20, 3),
  warn: new EventLimiter('Logged Warning', 20, 3),
};
const actions = { error: 'Logged Error', warn: 'Logged Warning' };

let isRecording = false;

/**
 * A logged line as it is recorded: a line made by `logged` with its values hidden; a plain text with every quoted text
 * hidden as well, as a text built elsewhere can hold a name in quotes; both scrubbed of paths and cut to the label's
 * length.
 */
export function loggedLineLabel(message: unknown, context: ErrorScrubbingContext): string {
  const text = message instanceof LoggedLine
    ? message.recorded
    : message instanceof Error
      ? `${message.name}: ${message.message}`
      : String(message).replace(/(['"`])[^'"`\n]*\1/g, (_match, quote: string) => `${quote}<value>${quote}`);
  return scrubMessage(text, context).slice(0, maxLabelLength);
}

/** The first error among a logged line's other arguments, as an unhandled error's label and value give it. */
export function loggedLineValue(args: readonly unknown[], context: ErrorScrubbingContext): string {
  const error = args.find(arg => arg instanceof Error);
  if (!error)
    return '';
  const { label, value } = errorForAnalytics(error, context);
  return value ? `${label}\n${value}` : label;
}

/** Records a logged error or warning, within its kind's limits. Never throws: it runs while the code logs. */
export function recordLoggedLine(processName: 'Main' | 'Renderer', level: 'error' | 'warn', message: unknown, args: readonly unknown[]): void {
  if (isRecording)
    return;

  isRecording = true;
  try {
    const limiter = limiters[level];
    if (limiter.isFull) {
      limiter.drop();
      return;
    }
    const context = scrubbingContext();
    const label = loggedLineLabel(message, context);
    if (!limiter.allows(label))
      return;
    Analytics.trackEvent(actions[level], `${actions[level]} (${processName})`, label, loggedLineValue(args, context));
  } catch {
    // Nothing more can be done here.
  } finally {
    isRecording = false;
  }
}
