import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { forgetUserChosenFolders, isUserChosenFolder, userChosenFolderPaths } from '../../../src-main/ipc/user-chosen-folders.js';
import { chooseFolderOf, openTargetOf } from '../../../src-main/open-target/open-target.js';

describe('openTargetOf (in main process)', () => {
  let root: string;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-open-target-'));
    fs.writeFileSync(path.join(root, 'a.jpg'), '');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));
  afterEach(() => forgetUserChosenFolders());

  it('opens nothing without --open', async () => {
    assert.deepStrictEqual(await openTargetOf(undefined), { kind: 'none' });
    assert.deepStrictEqual(await openTargetOf(''), { kind: 'none' });
  });

  it('opens a folder, or the folder of a file, which the main process found out', async () => {
    assert.deepStrictEqual(await openTargetOf(root), { kind: 'directory', path: root });
    const file = path.join(root, 'a.jpg');
    assert.deepStrictEqual(await openTargetOf(file), { kind: 'file', path: file, parentFolderPath: root });
  });

  it('gives the error of a path that is not there, for the renderer to report', async () => {
    const missing = path.join(root, 'missing.jpg');
    const target = await openTargetOf(missing);
    assert.strictEqual(target.kind, 'failed');
    assert.strictEqual(target.kind === 'failed' && target.path, missing);
    assert.match(target.kind === 'failed' ? target.message : '', /ENOENT/);
  });

  it('chooses the folder that a target opens: a folder itself, or the folder of a file, and nothing else', async () => {
    chooseFolderOf(await openTargetOf(path.join(root, 'a.jpg')));
    assert.deepStrictEqual(userChosenFolderPaths(), [path.resolve(root)]);
    forgetUserChosenFolders();
    chooseFolderOf(await openTargetOf(root));
    assert.deepStrictEqual(userChosenFolderPaths(), [path.resolve(root)]);
    forgetUserChosenFolders();
    for (const target of [await openTargetOf(undefined), await openTargetOf(path.join(root, 'missing')),
      { kind: 'unexpected' as const, path: root }])
      chooseFolderOf(target);
    assert.deepStrictEqual(userChosenFolderPaths(), []);
    assert.strictEqual(isUserChosenFolder(root), false);
  });
});
