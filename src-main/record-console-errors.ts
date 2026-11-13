import { WebContents } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics';
import { maxLabelLength, scrubConsoleMessage, scrubConsoleSource } from '../src-shared/analytics/error-for-analytics';
import { EventLimiter } from '../src-shared/analytics/event-limiter';
import { scrubbingContext } from '../src-shared/analytics/record-error';

/** What records a console error, which a test replaces. */
export type ConsoleErrorRecorder = (label: string, value: string) => void;

const consoleErrors = new EventLimiter('Console Error', 20, 3);

const recordConsoleError: ConsoleErrorRecorder = (label, value) =>
  Analytics.trackEvent('Console Error', 'Console Error (Renderer)', label, value);

/**
 * Whether a console line is recorded otherwise: the logger's own lines, which begin with the time and the process
 * ("[2026-11-14 …] [Renderer] [error] …") and are recorded as logged errors; Chromium's line for an error that nothing
 * caught ("Uncaught …"), and Angular's ("ERROR …"), which the renderer records with their stacks as unhandled errors;
 * and the line of a page that could not start (src/main.ts), which records it.
 */
export function isRecordedOtherwise(message: string): boolean {
  return /^\[[^\]]*\] \[[^\]]*\] \[(error|warn|info|debug)\] /.test(message)
    || /^Uncaught\b/.test(message)
    || /^ERROR\b/.test(message)
    || message.startsWith('The app could not start.');
}

/**
 * TL;DR: Records the errors that only the console of the main window's page shows, as "Console Error (Renderer)".
 * Details: A library that calls console.error, a resource that fails to load or a request that is refused throws
 * nothing that the renderer's listeners see. The main process gets every line of the page's console; it records those
 * of the level "error" that nothing else records (isRecordedOtherwise), the message without paths but for a web
 * address's origin, and the source and its line. Photo Data Viewer's window is left out: that application records its
 * own errors. A map without a connection logs a line per tile, so the same label is recorded three times at most.
 */
export function recordConsoleErrors(contents: WebContents, record: ConsoleErrorRecorder = recordConsoleError): void {
  contents.on('console-message', details => {
    try {
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
