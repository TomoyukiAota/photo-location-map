import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import type { FSWatcher } from 'chokidar6';
import { Logger } from '../src-shared/log/logger';

let watcher: FSWatcher;

export function configureLiveReload(mainFile: string): FSWatcher {
  if (watcher) return watcher;

  // Loaded only in development; packaged applications do not need this tool.
  const { watch } = require('chokidar6') as typeof import('chokidar6');
  watcher = watch(path.dirname(mainFile), {
    ignored: /node_modules|[/\\]\./,
    ignoreInitial: true,
  });
  watcher.on('error', error => Logger.error('Development file watcher failed.', error));
  watcher.on('change', changedFile => {
    if (path.resolve(changedFile) === path.resolve(mainFile)) {
      app.relaunch({ args: process.argv.slice(1) });
      app.quit();
    } else {
      for (const window of BrowserWindow.getAllWindows()) window.webContents.reloadIgnoringCache();
    }
  });
  // Unclosed file watchers keep the Node event loop alive after Electron quits.
  app.once('will-quit', () => { void watcher.close(); });
  return watcher;
}
