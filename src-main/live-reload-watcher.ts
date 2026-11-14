import * as path from 'path';
import type { FSWatcher, watch } from 'chokidar6';

/**
 * What the watcher of live reload acts on. configure-live-reload.ts gives it Electron's app and windows, and the test of
 * live reload (test/live-reload/run.mjs) stand-ins, as this file imports neither Electron nor chokidar.
 */
export interface LiveReloadHost {
  watch: typeof watch;
  /** Starts the app again with the same arguments, once it quits. */
  relaunch(): void;
  quit(): void;
  reloadWindows(): void;
  onWillQuit(listener: () => void): void;
  logError(message: string, error: unknown): void;
}

/**
 * Watches the folder of `mainFile`: a change of a module of the main process, which a renderer reload would not load
 * again, relaunches the app, and any other change reloads its windows.
 */
export function watchForLiveReload(host: LiveReloadHost, mainFile: string): FSWatcher {
  let relaunching = false;
  const watchRoot = path.dirname(path.resolve(mainFile));
  const watcher = host.watch(watchRoot, {
    ignored: candidate => {
      const relative = path.relative(watchRoot, candidate);
      // Check descendants only: a checkout itself may have hidden ancestors.
      if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) return false;
      return relative.split(path.sep).some(segment => segment === 'node_modules' || segment.startsWith('.'));
    },
    ignoreInitial: true,
  });
  watcher.on('error', error => host.logError('Development file watcher failed.', error));
  watcher.on('change', changedFile => {
    if (relaunching) return;
    // This directory contains main-process output. A renderer reload does not
    // invalidate Node's cached JavaScript modules, so those changes need a relaunch.
    const isMainProcessModule = ['.js', '.cjs', '.mjs'].includes(path.extname(changedFile).toLowerCase());
    if (path.resolve(changedFile) === path.resolve(mainFile) || isMainProcessModule) {
      // A compiler can update several modules before quit closes the watcher.
      relaunching = true;
      host.relaunch();
      host.quit();
    } else {
      host.reloadWindows();
    }
  });
  // Unclosed file watchers keep the Node event loop alive after Electron quits.
  host.onWillQuit(() => { void watcher.close(); });
  return watcher;
}
