import { ipcMain } from 'electron';
import { AnalyticsBackendWrapper } from '../../src-shared/analytics/library-wrapper/analytics-backend-wrapper.js';
import { Logger } from '../../src-shared/log/logger.js';
import { isFromMainWindow, isFromPhotoDataViewerWindow } from '../ipc/ipc-sender.js';

export class AnalyticsBackendIpcChannelName {
  // Photo Data Viewer also sends on this channel, from the window launch-photo-data-viewer.ts opens, so that its
  // events are recorded as part of this install's use (src/analytics/plm-backend.ts in
  // https://github.com/TomoyukiAota/photo-data-viewer). Photo Data Viewer is deployed apart from this app and serves
  // every released version of it at once, so it can send on one name only: this one must not be renamed.
  // The main window's preload (electron-util/preload/main-window.cjs) keeps a copy of the name.
  public static readonly trackEvent = 'analytics-backend-track-event';
}

/** Whether `field` is absent (undefined or null) or of one of the `types`. */
function isOptional(field: unknown, ...types: string[]): boolean {
  return field === undefined || field === null || types.includes(typeof field);
}

export class AnalyticsBackendIpcMain {
  /** Receives the events of the main window's page and of Photo Data Viewer's, for the analytics backend. */
  public static configureReceivingIpcFromRenderer() {
    ipcMain.on(
      AnalyticsBackendIpcChannelName.trackEvent,
      (event, category: unknown, action: unknown, label?: unknown, value?: unknown) => {
        if (!isFromMainWindow(event) && !isFromPhotoDataViewerWindow(event)) {
          Logger.warn(`Refused an analytics event from a page that is neither the main window's nor Photo Data Viewer's.`);
          return;
        }
        if (typeof category !== 'string' || typeof action !== 'string' || !isOptional(label, 'string') || !isOptional(value, 'string', 'number')) {
          Logger.warn(`Refused an analytics event whose category, action, label or value is not of its type.`);
          return;
        }
        AnalyticsBackendWrapper.trackEvent(category, action, label as string | undefined, value as string | number | undefined);
      }
    );
  }
}
