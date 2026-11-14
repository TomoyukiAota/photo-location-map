import { BrowserWindow } from 'electron';
import { Analytics } from '../src-shared/analytics/analytics.js';
import { recordUnhandledError } from '../src-shared/analytics/record-error.js';
import { Logger } from '../src-shared/log/logger.js';

/** The windows whose failures are recorded, by the names that the events have. */
export type RecordedWindow = 'Main Window' | 'Photo Data Viewer';

// A window that stops answering again and again does not flood analytics: each window records this many times.
export const maxUnresponsiveEventsPerWindow = 3;

/** What records a failure, which a test replaces. */
export interface WindowFailureRecorders {
  trackEvent: (category: string, action: string, label?: string) => void;
  recordError: (error: unknown) => void;
  now: () => number;
}

const recorders: WindowFailureRecorders = {
  trackEvent: (category, action, label) => Analytics.trackEvent(category, action, label),
  // The preload script runs in the window's renderer process.
  recordError: error => recordUnhandledError(error, 'Renderer'),
  now: () => Date.now(),
};

/**
 * Records two failures of a window that neither the main process nor the window's page can report as an error.
 * TL;DR: A preload script that fails, and a page that stops answering, are logged and recorded for analytics.
 * Details:
 * - The preload script gives the page its bridge to the main process. When it throws, the page has no bridge, so
 *   it can neither write to the log nor send an event: the main window then shows its loading text and nothing
 *   else. Only the main process learns of it, by this event.
 * - A page that does not answer the user for a while, in a long task or an endless loop, throws nothing. Electron
 *   tells the main process when it stops answering and when it answers again; how long it took is recorded with
 *   the second event.
 * The other ways in which a window fails are recorded elsewhere: a page that does not load makes loadURL() reject,
 * which is an unhandled rejection of the main process (unhandled-errors.ts), and a renderer process
 * that ends is recorded by record-process-gone.ts.
 */
export function recordWindowFailures(window: BrowserWindow, windowName: RecordedWindow, record = recorders): void {
  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    Logger.errorNotRecorded(`The preload of ${windowName} failed (${preloadPath}): ${error.stack ?? error.message}`);
    record.recordError(error);
  });

  let recordedTimes = 0;
  let unresponsiveSince: number | undefined;
  window.on('unresponsive', () => {
    if (unresponsiveSince !== undefined)
      return;
    unresponsiveSince = record.now();
    recordedTimes++;
    Logger.warnNotRecorded(`[Window Unresponsive] ${windowName} stopped answering.`);
    if (recordedTimes <= maxUnresponsiveEventsPerWindow)
      record.trackEvent('Window Unresponsive', `Window Unresponsive: ${windowName}`);
  });
  window.on('responsive', () => {
    if (unresponsiveSince === undefined)
      return;
    const seconds = Math.round((record.now() - unresponsiveSince) / 1000);
    unresponsiveSince = undefined;
    Logger.info(`[Window Unresponsive] ${windowName} answers again after ${seconds} s.`);
    if (recordedTimes <= maxUnresponsiveEventsPerWindow)
      record.trackEvent('Window Unresponsive', `Window Responsive Again: ${windowName}`, `After: ${seconds} s`);
  });
}
