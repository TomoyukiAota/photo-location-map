import { v4 as uuidv4 } from 'uuid';
import { createPrependedLogger } from '../../log/create-prepended-logger';
import { AnalyticsBackendEvent } from '../analytics-backend/analytics-backend-event';
import { AnalyticsBackendSender } from '../analytics-backend/analytics-backend-sender';
import { UnsentEventsFile } from '../analytics-backend/unsent-events-file';
import { AnalyticsBackendConfig } from '../config/analytics-backend-config';
import { AnalyticsBackendEndpoint } from '../config/analytics-backend-endpoint';
import { AnalyticsConfig } from '../config/analytics-config';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

const backendLogger = createPrependedLogger('[Analytics Backend]');

// Sends events to the analytics backend, from the main process only (renderer events arrive over IPC; see
// AnalyticsBackendIpcMain). When to send is decided by AnalyticsBackendSender.
export class AnalyticsBackendWrapper {
  // Required in initialize, not imported at the top: the renderer bundle also loads this file
  // (through the IPC module), and these are main-process modules.
  private static electron: typeof import('electron');
  private static crypto: typeof import('crypto');
  private static os: typeof import('os');
  private static endpoint: string;
  private static userId: string;
  private static sessionId: string;
  private static seq = 0;
  private static sender: AnalyticsBackendSender;
  private static isInitialized = false;

  @AnalyticsLibraryWrapperInitialize(backendLogger)
  public static initialize() {
    this.electron = require('electron');
    this.crypto = require('crypto');
    this.os = require('os');
    const path: typeof import('path') = require('path');
    this.endpoint = AnalyticsBackendConfig.endpoint;
    this.userId = AnalyticsConfig.userId;
    this.sessionId = uuidv4();
    backendLogger.info(`Endpoint: ${this.endpoint}`);
    backendLogger.info(`Session ID: ${this.sessionId}`);

    this.sender = new AnalyticsBackendSender({
      post: events => this.post(events),
      setTimer: (callback, delayMs) => {
        const timer = setTimeout(callback, delayMs);
        (timer as any).unref?.();  // A pending send must not keep the process alive.
        return timer;
      },
      clearTimer: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
      logger: backendLogger,
    });

    // Sending on quit may not finish, so keep what is left and send it on the next launch.
    // On will-quit rather than before-quit, so that events tracked on before-quit (such as the quit event) are kept.
    // One file per endpoint: the app launched with npm scripts and prerelease versions share the user data folder
    // with the released app, and their events must not be sent to the other endpoint.
    const unsentEventsFile = new UnsentEventsFile(path.join(this.electron.app.getPath('userData'),
      `analytics-backend-unsent-events-${AnalyticsBackendEndpoint.nameOf(this.endpoint)}.json`));
    const unsentEvents = this.loadUnsentEvents(unsentEventsFile);
    this.electron.app.on('will-quit', () => this.saveUnsentEvents(unsentEventsFile));
    this.isInitialized = true;
    this.sender.add(...unsentEvents);
  }

  @AnalyticsLibraryWrapperTrackEvent(backendLogger)
  public static trackEvent(category: string, action: string, label?: string, value?: string | number) {
    if (!this.isInitialized) {
      backendLogger.warn('AnalyticsBackendWrapper::initialize needs to be called before calling AnalyticsBackendWrapper::trackEvent');
      return;
    }

    this.sender.add({
      event_id: uuidv4(),
      user_id: this.userId,
      session_id: this.sessionId,
      seq: this.seq++,
      client_ts: new Date().toISOString(),
      app_version: this.electron.app.getVersion(),
      os: process.platform,
      os_release: this.os.release(),
      category,
      action,
      label: label ?? null,
      value: value ?? null,
    });
  }

  private static async post(events: AnalyticsBackendEvent[]): Promise<number> {
    const body = JSON.stringify({ schema_version: 1, events });
    const response = await this.electron.net.fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // The backend requires the SHA-256 of the body for POST.
        'x-amz-content-sha256': this.crypto.createHash('sha256').update(body).digest('hex'),
        'user-agent': `PhotoLocationMap/${this.electron.app.getVersion()} (${process.platform}; ${process.arch}) Electron/${process.versions.electron}`,
      },
      body,
    });
    if (response.ok) {
      // The backend drops events it cannot accept (for example, a label that is too long) and keeps the rest.
      const result = await response.json().catch(() => undefined) as { rejected?: number } | undefined;
      if (result?.rejected > 0)
        backendLogger.warn(`The backend rejected ${result.rejected} of ${events.length} events.`);
    }
    return response.status;
  }

  private static loadUnsentEvents(file: UnsentEventsFile): AnalyticsBackendEvent[] {
    try {
      const events = file.loadAndRemove();
      if (events.length > 0)
        backendLogger.info(`Loaded ${events.length} unsent events.`);
      return events;
    } catch (error) {
      backendLogger.warn(`Failed to load unsent events: ${error}`);
      return [];
    }
  }

  private static saveUnsentEvents(file: UnsentEventsFile): void {
    try {
      const events = this.sender.unsentEvents;
      file.save(events);
      if (events.length > 0)
        backendLogger.info(`Saved ${events.length} unsent events.`);
    } catch (error) {
      backendLogger.warn(`Failed to save unsent events: ${error}`);
    }
  }
}
