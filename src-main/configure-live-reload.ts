import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import type { FSWatcher } from 'chokidar6';
import { Logger } from '../src-shared/log/logger';

let watcher: FSWatcher;

export function configureLiveReload(mainFile: string): FSWatcher {
  if (watcher) return watcher;
  let relaunching = false;

  // Loaded only in development; packaged applications do not need this tool.
  const { watch } = require('chokidar6') as typeof import('chokidar6');
  watcher = watch(path.dirname(mainFile), {
    ignored: /node_modules|[/\\]\./,
    ignoreInitial: true,
  });
  watcher.on('error', error => Logger.error('Development file watcher failed.', error));
  watcher.on('change', changedFile => {
    if (relaunching) return;
    // This directory contains main-process output. A renderer reload does not
    // invalidate Node's cached JavaScript modules, so those changes need a relaunch.
    const isMainProcessModule = ['.js', '.cjs', '.mjs'].includes(path.extname(changedFile).toLowerCase());
    if (path.resolve(changedFile) === path.resolve(mainFile) || isMainProcessModule) {
      // A compiler can update several modules before quit closes the watcher.
      relaunching = true;
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
