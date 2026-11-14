import { parentPort } from 'worker_threads';
import { createFolderTree } from './folder-tree.js';

// A worker thread of the main process, which makes the tree of each folder that the user opens, one at a time, off the
// main thread: a large folder takes seconds to read synchronously (directory-tree-requests.ts).

parentPort.on('message', ({ id, dirPath }: { id: number, dirPath: string }) => {
  try {
    parentPort.postMessage({ id, result: createFolderTree(dirPath) });
  } catch (error) {
    parentPort.postMessage({ id, result: { kind: 'failed', message: error instanceof Error ? error.message : String(error) } });
  }
});
