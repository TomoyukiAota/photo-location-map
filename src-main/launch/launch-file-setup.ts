import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { Analytics, eventsKeptBeforeAnalytics, isAnalyticsSet, whenEventsKeptBeforeAnalyticsChange } from '../../src-shared/analytics/analytics.js';
import { launchSessionId } from '../../src-shared/analytics/launch-session.js';
import { Logger } from '../../src-shared/log/logger.js';
import { Launch, LaunchFiles, LaunchRecord } from './launch-files.js';

// TL;DR: This launch's file, written first thing and every minute, and removed when the app quits (launch-files.ts).
// Details: Imported right after the handler of unhandled errors (src-main/electron-main.ts), so that a launch whose
// setup fails is told too. Such a launch stops before its analytics are set, so the events that it tracks, the error of
// the setup among them, are kept in its file, which it keeps when it quits: the next launch tells it and sends them.
// A launch that starts writes its file without them once its analytics take them, so that they are not sent twice.
// On Windows, a shutdown or a log-off ends the app without will-quit (Electron's docs of the event), so a window's
// session-end removes the file then.

const aliveIntervalMs = 60 * 1000;
/** At most so many earlier launches are recorded at once, should many files have been left; the others, later. */
const maxRecordedLaunches = 5;
/** At most so many events that a launch tracked before its analytics were set are kept in its file, the latest. */
const maxKeptEvents = 20;

const launchFiles = new LaunchFiles(path.join(app.getPath('userData'), 'launches'));
const startedAt = new Date().toISOString();
const thisLaunch = (): Launch => ({ pid: process.pid, sessionId: launchSessionId() });
let isWriting = false;

function writeLaunchFile(): void {
  // A warning that the file could not be written is tracked as an event, which would write the file again.
  if (isWriting)
    return;
  isWriting = true;
  const keptEvents = eventsKeptBeforeAnalytics().slice(-maxKeptEvents);
  const record: LaunchRecord = {
    ...thisLaunch(), version: app.getVersion(), startedAt, lastAliveAt: new Date().toISOString(),
    ...(keptEvents.length > 0 ? { keptEvents } : {}),
  };
  try {
    launchFiles.write(record);
  } catch (error) {
    Logger.warn('Could not write the file of this launch.', error);
  } finally {
    isWriting = false;
  }
}

function removeLaunchFile(): void {
  try {
    launchFiles.remove(thisLaunch());
  } catch (error) {
    Logger.warn('Could not remove the file of this launch.', error);
  }
}

/** A launch that quits before its analytics were set did not start: its file is kept, for the next launch to tell. */
function onWillQuit(): void {
  if (isAnalyticsSet()) {
    removeLaunchFile();
  } else {
    Logger.warnNotRecorded('This launch quits before its analytics were set; its file is kept for the next launch.');
    writeLaunchFile();
  }
}

writeLaunchFile();
// With the events as they change: kept, or taken by the analytics once set, after which the file is written without them.
whenEventsKeptBeforeAnalyticsChange(writeLaunchFile);
setInterval(writeLaunchFile, aliveIntervalMs).unref();
app.on('will-quit', onWillQuit);
app.on('browser-window-created', (_event, window: BrowserWindow) => window.on('session-end', removeLaunchFile));

/**
 * Records the earlier launches that ended without removing their file, as "Launch Info: Previous Launch Ended
 * Abnormally", with the version, the session of their events, when they started and when they last wrote their file,
 * and then sends the events that a launch kept, which tracked them before its analytics were set. Called with the
 * launch's other events (src-main/record-at-app-launch.ts), once analytics can send them.
 */
export function recordLaunchesThatEndedAbnormally(): void {
  try {
    for (const launch of launchFiles.takeEndedAbnormally(thisLaunch(), maxRecordedLaunches)) {
      const keptEvents = launch.keptEvents ?? [];
      const kept = keptEvents.length > 0 ? `; Kept events: ${keptEvents.length}` : '';
      Logger.info(`[Launch Info] A launch of ${launch.version} that started at ${launch.startedAt} ended abnormally; it was last alive at ${launch.lastAliveAt}${kept}.`);
      Analytics.trackEvent('Launch Info', 'Launch Info: Previous Launch Ended Abnormally', `Version: ${launch.version}`,
        `Session ID: ${launch.sessionId}; Started: ${launch.startedAt}; Last alive: ${launch.lastAliveAt}${kept}`);
      for (const event of keptEvents)
        Analytics.trackEvent(...event);
    }
  } catch (error) {
    Logger.warn('Could not read the files of earlier launches.', error);
  }
}
