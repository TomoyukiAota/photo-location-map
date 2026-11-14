import type { BrowserWindow } from 'electron';
import { photoDataViewerLogger as logger } from '../../src-shared/photo-data-viewer/photo-data-viewer-logger.js';
import { perfMark } from '../../src-shared/perf/perf-mark.js';

/** What loadViewerPage uses of Photo Data Viewer's window, which a test stands in for. */
export type ViewerWindow = Pick<BrowserWindow, 'loadURL' | 'once' | 'isDestroyed' | 'show'>;

/**
 * Loads Photo Data Viewer's page into its window, and shows the window once the page has loaded, if `show`.
 * TL;DR: A load that closing the window stopped is no failure: it is logged, and the window is not shown.
 * Details: A user can close the window as soon as it appears, while its page is still loading. loadURL() then rejects,
 * just after the window's close event, as with ERR_FAILED (-2). Unhandled, that rejection was shown in the dialog of an
 * unhandled error and recorded as one (src-main/unhandled-errors.ts), and in the e2e suite, whose windows are hidden,
 * the dialog held the main process. Any other rejection still propagates: a page that does not load is recorded that
 * way (src-main/record-window-failures.ts).
 */
export async function loadViewerPage(window: ViewerWindow, url: string, show: boolean): Promise<void> {
  let isClosing = false;
  window.once('close', () => { isClosing = true; });

  try {
    await window.loadURL(url);
  } catch (error) {
    if (!isClosing && !window.isDestroyed())
      throw error;
    logger.info(`The window was closed while its page was loading, which stopped the load: ${error}`);
    return;
  }

  perfMark('view-data:page-loaded');
  if (show && !window.isDestroyed())
    window.show();
}
