import { WebContents } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics.js';
import { maxLabelLength, scrubConsoleMessage, scrubConsoleSource } from '../src-shared/analytics/error-for-analytics.js';
import { EventLimiter } from '../src-shared/analytics/event-limiter.js';
import { scrubbingContext } from '../src-shared/analytics/record-error.js';
import { Logger } from '../src-shared/log/logger.js';

/** What records a console error, which a test replaces. */
export type ConsoleErrorRecorder = (label: string, value: string) => void;

/** What writes a line of the page's console to the log, which a test replaces. */
export type ConsoleLineLogger = (line: string) => void;

const consoleErrors = new EventLimiter('Console Error', 20, 3);

const recordConsoleError: ConsoleErrorRecorder = (label, value) =>
  Analytics.trackEvent('Console Error', 'Console Error (Renderer)', label, value);

// Not recorded again: the line itself is, as a console error.
const logConsoleLine: ConsoleLineLogger = line => Logger.errorNotRecorded(line);

/**
 * Whether a console line is recorded otherwise: the logger's own lines, which begin with the time and the process
 * ("[2026-11-14 …] [Renderer] [error] …") and are recorded as logged errors; Chromium's line for an error that nothing
 * caught ("Uncaught …"), and Angular's ("ERROR …"), which the renderer records with their stacks as unhandled errors;
 * and the line of a page that could not start (src/main.ts), which records it.
 */
export function isRecordedOtherwise(message: string): boolean {
  return isLoggerLine(message)
    || /^Uncaught\b/.test(message)
    || /^ERROR\b/.test(message)
    || message.startsWith('The app could not start.');
}

/** Whether a console line is the logger's own, which the log file has already (src-shared/log/logger.ts). */
function isLoggerLine(message: string): boolean {
  return /^\[[^\]]*\] \[[^\]]*\] \[(error|warn|info|debug)\] /.test(message);
}

/**
 * Whether a console line is about the page's Content Security Policy (src-main/file-server/): Chromium's for what the
 * policy refused ("Loading the image '…' violates the following Content Security Policy directive: …") or for a policy
 * that it could not read whole ("Unrecognized Content-Security-Policy directive '…'."), or the page's for a string that
 * the policy refused to evaluate (src/main.ts).
 */
export function isContentSecurityPolicyLine(message: string): boolean {
  return /\bContent[- ]Security[- ]Policy\b/i.test(message);
}

/**
 * TL;DR: Records the errors that only the console of the main window's page shows, as "Console Error (Renderer)", and
 * writes each line about its Content Security Policy to the log.
 * Details: A library that calls console.error, a resource that fails to load or a request that is refused throws
 * nothing that the renderer's listeners see. The main process gets every line of the page's console; it records those
 * of the level "error" that nothing else records (isRecordedOtherwise), the message without paths but for a web
 * address's origin, and the source and its line. Photo Data Viewer's window is left out: that application records its
 * own errors. A map without a connection logs a line per tile, so the same label is recorded three times at most. A
 * refusal of the page's Content Security Policy is such an error. Its line goes to the log too, which would have no
 * trace of it otherwise: Chromium writes it to the console only, also for what index.html loads before any script runs.
 */
export function recordConsoleErrors(contents: WebContents, record: ConsoleErrorRecorder = recordConsoleError,
  log: ConsoleLineLogger = logConsoleLine): void {
  contents.on('console-message', details => {
    try {
      if (isContentSecurityPolicyLine(details.message) && !isLoggerLine(details.message))
        log(`[Content Security Policy] The main window's page: ${details.message} (${details.sourceId}:${details.lineNumber})`);
      if (details.level !== 'error' || isRecordedOtherwise(details.message))
        return;
      if (consoleErrors.isFull) {
        consoleErrors.drop();
        return;
      }
      const context = scrubbingContext();
      const label = scrubConsoleMessage(details.message, context).slice(0, maxLabelLength);
      if (!consoleErrors.allows(label))
        return;
      const source = scrubConsoleSource(details.sourceId, context);
      record(label, source ? `${source}:${details.lineNumber}` : '');
    } catch {
      // Recording must not fail the page's console.
    }
  });
}
