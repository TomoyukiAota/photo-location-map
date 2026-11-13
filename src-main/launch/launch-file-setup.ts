import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { Analytics } from '../../src-shared/analytics/analytics';
import { launchSessionId } from '../../src-shared/analytics/launch-session';
import { Logger } from '../../src-shared/log/logger';
import { LaunchFiles, LaunchRecord } from './launch-files';

// TL;DR: This launch's file, written first thing and every minute, and removed when the app quits (launch-files.ts).
// Details: Imported right after the handler of unhandled errors (src-main/electron-main.ts), so that a launch whose
// setup fails is told too. On Windows, a shutdown or a log-off ends the app without will-quit (Electron's docs of the
// event), so a window's session-end removes the file then.

const aliveIntervalMs = 60 * 1000;
/** At most so many earlier launches are recorded at once, should many files have been left. */
const maxRecordedLaunches = 5;

const launchFiles = new LaunchFiles(path.join(app.getPath('userData'), 'launches'));
const startedAt = new Date().toISOString();

function writeLaunchFile(): void {
  const record: LaunchRecord = {
    pid: process.pid, sessionId: launchSessionId(), version: app.getVersion(), startedAt, lastAliveAt: new Date().toISOString(),
  };
  try {
    launchFiles.write(record);
  } catch (error) {
    Logger.warn('Could not write the file of this launch.', error);
  }
}

function removeLaunchFile(): void {
  try {
    launchFiles.remove(process.pid);
  } catch (error) {
    Logger.warn('Could not remove the file of this launch.', error);
  }
}

writeLaunchFile();
setInterval(writeLaunchFile, aliveIntervalMs).unref();
app.on('will-quit', removeLaunchFile);
app.on('browser-window-created', (_event, window: BrowserWindow) => window.on('session-end', removeLaunchFile));

/**
 * Records the earlier launches that ended without removing their file, as "Launch Info: Previous Launch Ended
 * Abnormally", with the version, the session of their events, when they started and when they last wrote their file.
 * Called with the launch's other events (src-main/record-at-app-launch.ts), once analytics can send them.
 */
export function recordLaunchesThatEndedAbnormally(): void {
  try {
    const launches = launchFiles.takeEndedAbnormally(process.pid);
    for (const launch of launches.slice(-maxRecordedLaunches)) {
      Logger.info(`[Launch Info] A launch of ${launch.version} that started at ${launch.startedAt} ended abnormally; it was last alive at ${launch.lastAliveAt}.`);
      Analytics.trackEvent('Launch Info', 'Launch Info: Previous Launch Ended Abnormally', `Version: ${launch.version}`,
        `Session ID: ${launch.sessionId}; Started: ${launch.startedAt}; Last alive: ${launch.lastAliveAt}`);
    }
  } catch (error) {
    Logger.warn('Could not read the files of earlier launches.', error);
  }
}
