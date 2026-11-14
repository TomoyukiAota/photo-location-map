import assert from 'assert';
import type { DirectoryTree } from 'directory-tree';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createDirectoryTreeInWorker, stopDirectoryTreeWorker, useDirectoryTreeWorker } from '../../../src-main/directory-tree/directory-tree-requests.js';
import { createFolderTree, livePhotosOf } from '../../../src-main/directory-tree/folder-tree.js';
import { convertToFlattenedDirTree } from '../../../src-shared/dir-tree/dir-tree-util.js';

describe('The tree of a folder (in main process)', () => {
  let root: string;
  let folder: string;
  let workerFiles: string;
  const appWorker = path.join(import.meta.dirname, '..', '..', '..', 'src-main', 'directory-tree', 'directory-tree-worker.js');

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-folder-tree-'));
    folder = path.join(root, 'photos');
    fs.mkdirSync(path.join(folder, 'day 2'), { recursive: true });
    for (const name of ['IMG_0001.JPG', 'IMG_0001.MOV', 'IMG_0002.HEIC', '.DS_Store', 'Thumbs.db', 'desktop.ini', path.join('day 2', 'IMG_0003.jpg'), path.join('day 2', '._IMG_0003.jpg'), path.join('day 2', 'IMG_0003.mp4')])
      fs.writeFileSync(path.join(folder, name), '');
    // A worker that fails to start; the app's own is compiled with the tests (test/em.tsconfig.json).
    workerFiles = path.join(root, 'workers');
    fs.mkdirSync(workerFiles);
    fs.writeFileSync(path.join(workerFiles, 'failing-worker.js'), `throw new Error('The worker could not start.');\n`);
  });

  after(() => {
    stopDirectoryTreeWorker();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('leaves out the hidden files of macOS and Windows, and gives each item its mtime', () => {
    const result = createFolderTree(folder);
    assert.strictEqual(result.kind, 'ok');
    if (result.kind !== 'ok') return;
    const items = convertToFlattenedDirTree(result.tree);
    assert.deepStrictEqual(items.map(item => path.relative(folder, item.path)).sort(),
      ['', 'IMG_0001.JPG', 'IMG_0001.MOV', 'IMG_0002.HEIC', 'day 2', path.join('day 2', 'IMG_0003.jpg'), path.join('day 2', 'IMG_0003.mp4')].sort());
    for (const item of items) {
      assert(item['fsStats'].mtime instanceof Date, item.path);
      assert.strictEqual(item['fsStats'].mtime.getTime(), fs.statSync(item.path).mtime.getTime(), item.path);
      assert.deepStrictEqual(Object.keys(item['fsStats']), ['mtime']);
    }
  });

  it('matches each photo with its Live Photos movie without regard to case, and gives the movie\'s own path', () => {
    const result = createFolderTree(folder);
    assert.strictEqual(result.kind, 'ok');
    if (result.kind !== 'ok') return;
    // IMG_0001.JPG has its movie as .MOV, and the extensions of Live Photos are looked for in lower case. The path
    // is not lowercased: a file system with regard to case, as those of Linux, has no file at such a path.
    assert.deepStrictEqual(result.livePhotos, {
      [path.join(folder, 'IMG_0001.JPG')]: path.join(folder, 'IMG_0001.MOV'),
      [path.join(folder, 'day 2', 'IMG_0003.jpg')]: path.join(folder, 'day 2', 'IMG_0003.mp4'),
    });
  });

  it('matches a photo with a movie of its own folder only, where the names of two folders differ in case alone', () => {
    // A tree made by hand: only a file system with regard to case, as those of Linux, can hold these two folders.
    const file = (...parts: string[]): DirectoryTree => {
      const name = parts[parts.length - 1];
      return { path: path.join(folder, ...parts), name, type: 'file', extension: path.extname(name).toLowerCase() };
    };
    const tree: DirectoryTree = { path: folder, name: 'photos', type: 'directory', children: [
      { path: path.join(folder, 'album'), name: 'album', type: 'directory',
        children: [file('album', 'IMG_0004.jpg'), file('album', 'IMG_0005.jpg'), file('album', 'img_0005.MOV')] },
      { path: path.join(folder, 'Album'), name: 'Album', type: 'directory', children: [file('Album', 'IMG_0004.mov')] },
    ] };
    // IMG_0004.jpg has no movie: the one of that name is in the other folder. IMG_0005.jpg has the one next to it.
    assert.deepStrictEqual(livePhotosOf(tree), {
      [path.join(folder, 'album', 'IMG_0005.jpg')]: path.join(folder, 'album', 'img_0005.MOV'),
    });
  });

  it('gives no tree for a folder that is not there, as directory-tree does', () => {
    assert.deepStrictEqual(createFolderTree(path.join(root, 'not there')), { kind: 'ok', tree: null, livePhotos: {} });
  });

  it('makes the same tree in a worker thread', async () => {
    useDirectoryTreeWorker(appWorker);
    assert.deepStrictEqual(await createDirectoryTreeInWorker(folder), createFolderTree(folder));
    // One request at a time, in the order sent.
    const [first, second] = await Promise.all([createDirectoryTreeInWorker(folder), createDirectoryTreeInWorker(path.join(folder, 'day 2'))]);
    assert.deepStrictEqual([first, second], [createFolderTree(folder), createFolderTree(path.join(folder, 'day 2'))]);
  });

  it('fails the requests of a worker that fails, and starts another for the next request', async () => {
    useDirectoryTreeWorker(path.join(workerFiles, 'failing-worker.js'));
    await assert.rejects(createDirectoryTreeInWorker(folder), /The worker could not start/);
    useDirectoryTreeWorker(appWorker);
    assert.deepStrictEqual(await createDirectoryTreeInWorker(folder), createFolderTree(folder));
  });

  it('fails the requests of a worker that is stopped, without failing those of the next one', async () => {
    useDirectoryTreeWorker(appWorker);
    const stopped = createDirectoryTreeInWorker(folder);
    stopDirectoryTreeWorker();
    const next = createDirectoryTreeInWorker(folder);
    await assert.rejects(stopped, /stopped/);
    assert.deepStrictEqual(await next, createFolderTree(folder));
  });
});
