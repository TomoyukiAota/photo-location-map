import { app, BrowserWindow } from 'electron';
import type { FSWatcher } from 'chokidar6';
import { Logger } from '../src-shared/log/logger.js';
import { watchForLiveReload } from './live-reload-watcher.js';

let watcher: Promise<FSWatcher> | undefined;

/** Relaunches the app when its main process's files change, and reloads its windows when another file does. */
export function configureLiveReload(mainFile: string): Promise<FSWatcher> {
  // Imported only in development: a package does not have chokidar6, and an import at the top would look for it there.
  watcher ??= import('chokidar6').then(({ watch }) => watchForLiveReload({
    watch,
    relaunch: () => app.relaunch({ args: process.argv.slice(1) }),
    quit: () => app.quit(),
    reloadWindows: () => {
      for (const window of BrowserWindow.getAllWindows()) window.webContents.reloadIgnoringCache();
    },
    onWillQuit: listener => app.once('will-quit', listener),
    logError: (message, error) => Logger.error(message, error),
  }, mainFile));
  return watcher;
}
