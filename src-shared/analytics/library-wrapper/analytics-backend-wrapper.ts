/* eslint-disable @typescript-eslint/no-require-imports -- Node's modules are loaded in initialize, not at the top: see the class. */
import { v4 as uuidv4 } from 'uuid';
import { createPrependedLogger } from '../../log/create-prepended-logger';
import { isProcessRunning } from '../../process/is-process-running';
import { AnalyticsBackendEvent } from '../analytics-backend/analytics-backend-event';
import { AnalyticsBackendSender } from '../analytics-backend/analytics-backend-sender';
import { UnsentEventsFile, UnsentEventsFiles } from '../analytics-backend/unsent-events-file';
import { AnalyticsBackendConfig } from '../config/analytics-backend-config';
import { AnalyticsBackendEndpoint } from '../config/analytics-backend-endpoint';
import { AnalyticsConfig } from '../config/analytics-config';
import { launchSessionId } from '../launch-session';
import { AnalyticsLibraryWrapperInitialize, AnalyticsLibraryWrapperTrackEvent } from './library-wrapper-decorator';

// Its errors and warnings are not recorded: they would record the analytics' own failures to send.
const backendLogger = createPrependedLogger('[Analytics Backend]', { recorded: false });

// Sends events to the analytics backend, from the main process only (renderer events arrive over IPC; see
// AnalyticsBackendIpcMain in src-main/analytics/). When to send is decided by AnalyticsBackendSender.
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
  private static unsentEventsFile: UnsentEventsFile;
  /** Whether this launch's file of unsent events may hold events that have been sent since it was saved. */
  private static isUnsentEventsFileWritten = false;
  private static isInitialized = false;

  @AnalyticsLibraryWrapperInitialize(backendLogger)
  public static initialize() {
    this.electron = require('electron');
    this.crypto = require('crypto');
    this.os = require('os');
    this.endpoint = AnalyticsBackendConfig.endpoint;
    this.userId = AnalyticsConfig.userId;
    this.sessionId = launchSessionId();
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
      // The events sent are taken out of this launch's file, if it was written.
      onBatchDone: () => {
        if (this.isUnsentEventsFileWritten)
          this.saveUnsentEvents();
      },
    });

    // TL;DR: What is not sent yet is kept in a file, which the next launch sends, as sending may not finish.
    // Details: Saved on will-quit rather than before-quit, so that events tracked on before-quit (such as the quit
    // event) are kept, and when an error is tracked, so that an error that comes before a crash is not lost with it.
    // A file per endpoint: the app launched with npm scripts and prerelease versions share the user data folder with
    // the released app, and their events must not be sent to the other endpoint. And a file per launch, as two
    // launches can run at once: a launch takes over those that ended launches left (UnsentEventsFiles).
    const files = new UnsentEventsFiles(this.electron.app.getPath('userData'), AnalyticsBackendEndpoint.nameOf(this.endpoint), isProcessRunning);
    this.unsentEventsFile = files.own(process.pid);
    const unsentEvents = this.takeOverUnsentEvents(files);
    this.electron.app.on('will-quit', () => this.saveUnsentEvents());
    this.isInitialized = true;
    this.sender.add(...unsentEvents);
  }

  /**
   * The categories of events whose tracking saves the unsent events at once: those of errors, which may come just
   * before a crash.
   */
  private static readonly categoriesSavedAtOnce: readonly string[] = [
    'Unhandled Error', 'Logged Error', 'Process Gone', 'Window Unresponsive', 'Console Error', 'Errors Dropped',
  ];

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
    if (this.categoriesSavedAtOnce.includes(category) || action === 'Launch Info: Previous Launch Ended Abnormally')
      this.saveUnsentEvents();
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

  /** The events that ended launches left, taken over into this launch's own file (UnsentEventsFiles.takeOver). */
  private static takeOverUnsentEvents(files: UnsentEventsFiles): AnalyticsBackendEvent[] {
    try {
      const events = files.takeOver(process.pid, message => backendLogger.warn(message));
      if (events.length > 0) {
        this.isUnsentEventsFileWritten = true;
        backendLogger.info(`Loaded ${events.length} unsent events.`);
      }
      return events;
    } catch (error) {
      backendLogger.warn(`Failed to load unsent events: ${error}`);
      return [];
    }
  }

  private static saveUnsentEvents(): void {
    try {
      const events = this.sender.unsentEvents;
      this.unsentEventsFile.save(events);
      this.isUnsentEventsFileWritten = events.length > 0;
      if (events.length > 0)
        backendLogger.info(`Saved ${events.length} unsent events.`);
    } catch (error) {
      backendLogger.warn(`Failed to save unsent events: ${error}`);
    }
  }
}
