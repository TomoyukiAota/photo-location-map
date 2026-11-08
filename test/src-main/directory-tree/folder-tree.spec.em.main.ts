import assert = require('assert');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createDirectoryTreeInWorker, stopDirectoryTreeWorker, useDirectoryTreeWorker } from '../../../src-main/directory-tree/directory-tree-requests';
import { createFolderTree } from '../../../src-main/directory-tree/folder-tree';
import { convertToFlattenedDirTree } from '../../../src-shared/dir-tree/dir-tree-util';

describe('The tree of a folder (in main process)', () => {
  let root: string;
  let folder: string;
  let workerFiles: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-folder-tree-'));
    folder = path.join(root, 'photos');
    fs.mkdirSync(path.join(folder, 'day 2'), { recursive: true });
    for (const name of ['IMG_0001.JPG', 'IMG_0001.MOV', 'IMG_0002.HEIC', '.DS_Store', 'Thumbs.db', 'desktop.ini', path.join('day 2', 'IMG_0003.jpg'), path.join('day 2', '._IMG_0003.jpg'), path.join('day 2', 'IMG_0003.mp4')])
      fs.writeFileSync(path.join(folder, name), '');
    // A worker that runs the TypeScript sources, as the tests do, and ones that fail.
    workerFiles = path.join(root, 'workers');
    fs.mkdirSync(workerFiles);
    const project = path.join(__dirname, '..', '..', 'em-main.tsconfig.json');
    const workerSource = path.join(__dirname, '..', '..', '..', 'src-main', 'directory-tree', 'directory-tree-worker.ts');
    fs.writeFileSync(path.join(workerFiles, 'worker.js'), `require(${JSON.stringify(require.resolve('ts-node'))})`
      + `.register({ transpileOnly: true, project: ${JSON.stringify(project)} });\nrequire(${JSON.stringify(workerSource)});\n`);
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

  it('matches each photo with its Live Photos movie, lowercased, as the renderer did', () => {
    const result = createFolderTree(folder);
    assert.strictEqual(result.kind, 'ok');
    if (result.kind !== 'ok') return;
    assert.deepStrictEqual(result.livePhotos, {
      [path.join(folder, 'IMG_0001.JPG')]: path.join(folder, 'IMG_0001.mov').toLowerCase(),
      [path.join(folder, 'day 2', 'IMG_0003.jpg')]: path.join(folder, 'day 2', 'IMG_0003.mp4').toLowerCase(),
    });
  });

  it('gives no tree for a folder that is not there, as directory-tree does', () => {
    assert.deepStrictEqual(createFolderTree(path.join(root, 'not there')), { kind: 'ok', tree: null, livePhotos: {} });
  });

  it('makes the same tree in a worker thread', async () => {
    useDirectoryTreeWorker(path.join(workerFiles, 'worker.js'));
    assert.deepStrictEqual(await createDirectoryTreeInWorker(folder), createFolderTree(folder));
    // One request at a time, in the order sent.
    const [first, second] = await Promise.all([createDirectoryTreeInWorker(folder), createDirectoryTreeInWorker(path.join(folder, 'day 2'))]);
    assert.deepStrictEqual([first, second], [createFolderTree(folder), createFolderTree(path.join(folder, 'day 2'))]);
  });

  it('fails the requests of a worker that fails, and starts another for the next request', async () => {
    useDirectoryTreeWorker(path.join(workerFiles, 'failing-worker.js'));
    await assert.rejects(createDirectoryTreeInWorker(folder), /The worker could not start/);
    useDirectoryTreeWorker(path.join(workerFiles, 'worker.js'));
    assert.deepStrictEqual(await createDirectoryTreeInWorker(folder), createFolderTree(folder));
  });

  it('fails the requests of a worker that is stopped, without failing those of the next one', async () => {
    useDirectoryTreeWorker(path.join(workerFiles, 'worker.js'));
    const stopped = createDirectoryTreeInWorker(folder);
    stopDirectoryTreeWorker();
    const next = createDirectoryTreeInWorker(folder);
    await assert.rejects(stopped, /stopped/);
    assert.deepStrictEqual(await next, createFolderTree(folder));
  });
});
