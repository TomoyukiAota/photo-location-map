import * as path from 'path';
import { Worker } from 'worker_threads';
import type { DirectoryTreeResult } from '../../src-shared/bridge/plm-bridge.js';
import { Logger } from '../../src-shared/log/logger.js';

// TL;DR: The trees of opened folders, made in one worker thread of the main process, one folder at a time.
// Details: Reading a folder's tree is synchronous (directory-tree) and takes seconds for a large folder, so it never
// runs on the main thread. Until the main window was isolated, a Node.js-enabled Web Worker of the renderer made the
// trees; it was started with the page, so this one is started once the page has loaded (src-main/electron-main.ts),
// for the first folder not to wait for it. A worker that fails or exits fails its requests, and the next request
// starts another.

interface Pending {
  resolve(result: DirectoryTreeResult): void;
  reject(error: Error): void;
}

/** A worker, with the requests that it has not answered yet. */
interface TreeWorker {
  thread: Worker;
  pending: Map<number, Pending>;
}

// In a package, the script is in app.asar, from which the worker thread loads it and the modules that it imports, as
// the main process does: nothing is left out of the archive for it (docs/tasks/20261114_enable-asar/).
let workerFile = path.join(import.meta.dirname, 'directory-tree-worker.js');
let current: TreeWorker | undefined;
let nextId = 0;

/** Uses another worker script, for the tests: one that fails to start, or the app's own again. */
export function useDirectoryTreeWorker(file: string): void {
  workerFile = file;
  stopDirectoryTreeWorker();
}

/** Fails the requests that `treeWorker` has not answered, and forgets it, so that the next request starts another. */
function fail(treeWorker: TreeWorker, error: Error): void {
  if (current === treeWorker) current = undefined;
  for (const request of treeWorker.pending.values()) request.reject(error);
  treeWorker.pending.clear();
}

/** The worker that reads the trees, started at first use; when it fails or exits, its unanswered requests fail. */
function startedWorker(): TreeWorker {
  if (current)
    return current;
  const treeWorker: TreeWorker = { thread: new Worker(workerFile), pending: new Map() };
  treeWorker.thread.on('message', ({ id, result }: { id: number, result: DirectoryTreeResult }) => {
    treeWorker.pending.get(id)?.resolve(result);
    treeWorker.pending.delete(id);
  });
  treeWorker.thread.on('error', error => {
    Logger.error('The worker that reads the trees of folders failed.', error);
    fail(treeWorker, error);
  });
  treeWorker.thread.on('exit', code => fail(treeWorker, new Error(`The worker that reads the trees of folders exited with code ${code}.`)));
  // The worker never keeps the app from quitting.
  treeWorker.thread.unref();
  current = treeWorker;
  return treeWorker;
}

/** Starts the worker before it is needed. */
export function startDirectoryTreeWorker(): void {
  startedWorker();
}

/** Stops the worker; the requests that it has not answered fail. */
export function stopDirectoryTreeWorker(): void {
  const stopped = current;
  if (!stopped)
    return;
  fail(stopped, new Error('The worker that reads the trees of folders was stopped.'));
  void stopped.thread.terminate();
}

/** The tree of the folder at `dirPath`, made in the worker. */
export function createDirectoryTreeInWorker(dirPath: string): Promise<DirectoryTreeResult> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const treeWorker = startedWorker();
    treeWorker.pending.set(id, { resolve, reject });
    treeWorker.thread.postMessage({ id, dirPath });
  });
}
