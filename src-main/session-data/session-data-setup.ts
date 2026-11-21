import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Logger } from '../../src-shared/log/logger.js';
import { isProcessRunning } from '../../src-shared/process/is-process-running.js';
import {
  instanceSessionDataFolder, releaseSessionDataLock, removeEndedInstancesSessionData, SessionDataHost, takeSessionDataLock,
} from './session-data-lock.js';

// TL;DR: An instance that starts while another runs on the same profile keeps Chromium's storage (Local Storage,
// IndexedDB, cookies, the HTTP cache) in a folder of its own, so that its page does not wait for the other's storage.
// Details: Each launch is a process of its own, as Explorer's "Open with Photo Location Map" starts one for each item,
// and all of them use the profile in userData, where Chromium keeps its storage (sessionData). Chromium lets one
// process at a time open a database of it. The analytics SDKs open IndexedDB when the page starts, and then call Web
// Storage, which waits while Chromium tries again to open the database that the other instance holds: the page of a
// second launch waited about 4 s before the app's code ran, whether the first had just started or had run for a while
// (docs/tasks/20261121_two-instance-storage/REPORT.md). The settings and the app's other files in userData are the
// app's own, and stay shared. Set before the app is ready, when Chromium reads sessionData; an instance of its own
// starts with empty caches.

const host: SessionDataHost = {
  pid: process.pid,
  isRunning: isProcessRunning,
  now: () => Date.now(),
  bootTime: () => Date.now() - os.uptime() * 1000,
};
const instancesFolder = path.join(app.getPath('userData'), 'instances');
const lockPath = path.join(instancesFolder, 'shared-session-data.lock');

/** Whether this instance keeps Chromium's storage in the profile: it holds the lock, or the lock cannot be written. */
function keepsSharedSessionData(): boolean {
  try {
    return takeSessionDataLock(lockPath, host);
  } catch (error) {
    Logger.warn('[Session Data] The lock of the session data could not be taken, so this instance keeps it in the profile.', error);
    return true;
  }
}

if (keepsSharedSessionData()) {
  // On Windows, a shutdown or a log-off ends the app without will-quit, but with a window's session-end.
  const release = () => releaseSessionDataLock(lockPath, host);
  app.on('will-quit', release);
  app.on('browser-window-created', (_event, window: BrowserWindow) => window.on('session-end', release));
} else {
  const folder = instanceSessionDataFolder(instancesFolder, process.pid);
  fs.mkdirSync(folder, { recursive: true });
  app.setPath('sessionData', folder);
  Logger.info(`[Session Data] Another instance keeps Chromium's storage in the profile, so this one keeps its own in ${folder}`);
}

// Once the app is ready, so as not to slow its start: the folders of the instances that have ended.
app.whenReady()
  .then(() => removeEndedInstancesSessionData(instancesFolder, host))
  .then(removed => {
    if (removed.length > 0)
      Logger.info(`[Session Data] Removed the storage of the instances that have ended: ${removed.join(', ')}`);
  })
  .catch(error => Logger.warn('[Session Data] Could not remove the storage of the instances that have ended.', error));
