import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { chooseDroppedItem, droppedItemTargetOf } from '../../../src-main/dropped-item/dropped-item.js';
import { forgetUserChosenFolders, isInUserChosenFolder, userChosenFolderPaths } from '../../../src-main/ipc/user-chosen-folders.js';

describe('dropped-item (in main process)', () => {
  let root: string;
  let folder: string;
  let photo: string;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-dropped-item-'));
    folder = path.join(root, 'trip # 100%');
    fs.mkdirSync(folder);
    photo = path.join(folder, 'a.jpg');
    fs.writeFileSync(photo, '');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));
  afterEach(() => forgetUserChosenFolders());

  it('tells what a dropped folder or file opens, without choosing its folder before the user confirms', async () => {
    assert.deepStrictEqual(await droppedItemTargetOf(folder), { kind: 'directory', path: folder });
    assert.deepStrictEqual(await droppedItemTargetOf(photo), { kind: 'file', path: photo, parentFolderPath: folder });
    assert.deepStrictEqual(userChosenFolderPaths(), []);
    assert.strictEqual(isInUserChosenFolder(photo), false);
  });

  it('chooses the folder, or the folder of the file, once the user has confirmed', async () => {
    assert.deepStrictEqual(await chooseDroppedItem(folder), { kind: 'directory', path: folder });
    assert.deepStrictEqual(userChosenFolderPaths(), [path.resolve(folder)]);
    forgetUserChosenFolders();
    assert.deepStrictEqual(await chooseDroppedItem(photo), { kind: 'file', path: photo, parentFolderPath: folder });
    assert.deepStrictEqual(userChosenFolderPaths(), [path.resolve(folder)]);
    // Only that folder: not the one around it.
    assert.strictEqual(isInUserChosenFolder(root), false);
  });

  it('opens and chooses nothing for what no drop gives: a relative path, an empty one, or what is not a path', async () => {
    // The tests run in the repository's folder, where --open would open these two.
    assert.strictEqual(fs.existsSync('package.json') && fs.existsSync('test'), true);
    for (const notDropped of ['package.json', 'test', '', undefined, null, 1, [folder], { path: folder }]) {
      assert.deepStrictEqual(await droppedItemTargetOf(notDropped), { kind: 'none' }, String(notDropped));
      assert.deepStrictEqual(await chooseDroppedItem(notDropped), { kind: 'none' }, String(notDropped));
    }
    assert.deepStrictEqual(userChosenFolderPaths(), []);
  });

  it('chooses nothing for an item that is no longer there', async () => {
    const missing = path.join(folder, 'gone');
    const target = await chooseDroppedItem(missing);
    assert.strictEqual(target.kind, 'failed');
    assert.deepStrictEqual(userChosenFolderPaths(), []);
  });
});
