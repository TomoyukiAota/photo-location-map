import assert from 'assert';
import * as path from 'path';
import {
  forgetUserChosenFolders, isInUserChosenFolder, isUserChosenFolder, rememberUserChosenFolder
} from '../../../src-main/ipc/user-chosen-folders.js';

describe('user-chosen-folders (in main process)', () => {
  const folder = path.resolve('/photos', 'trip');
  afterEach(() => forgetUserChosenFolders());

  it('knows the folders that the user chose, and what is in them', () => {
    rememberUserChosenFolder(folder);
    assert.strictEqual(isUserChosenFolder(folder), true);
    assert.strictEqual(isUserChosenFolder(folder + path.sep), true);
    assert.strictEqual(isInUserChosenFolder(folder), true);
    assert.strictEqual(isInUserChosenFolder(path.join(folder, 'day 1', 'a.jpg')), true);
    assert.strictEqual(isUserChosenFolder(path.join(folder, 'day 1')), false);
  });

  it('takes no other folder: not a parent, a sibling with the same start, or a path that leaves the folder', () => {
    rememberUserChosenFolder(folder);
    assert.strictEqual(isInUserChosenFolder(path.resolve('/photos')), false);
    assert.strictEqual(isInUserChosenFolder(path.resolve('/photos', 'trip2', 'a.jpg')), false);
    assert.strictEqual(isInUserChosenFolder(`${folder}${path.sep}..${path.sep}other${path.sep}a.jpg`), false);
    assert.strictEqual(isInUserChosenFolder(''), false);
    assert.strictEqual(isInUserChosenFolder(undefined), false);
    assert.strictEqual(isInUserChosenFolder(['/photos/trip/a.jpg']), false);
  });

  it('compares without regard to case on macOS and Windows, whose file systems do by default', () => {
    rememberUserChosenFolder(folder);
    const caseInsensitive = process.platform === 'darwin' || process.platform === 'win32';
    assert.strictEqual(isInUserChosenFolder(path.join(folder.toUpperCase(), 'A.JPG')), caseInsensitive);
  });

  it('takes a relative path, as --open can give, relative to the working directory', () => {
    rememberUserChosenFolder(path.join('relative', 'photos'));
    assert.strictEqual(isUserChosenFolder(path.resolve('relative', 'photos')), true);
    assert.strictEqual(isInUserChosenFolder(path.join('relative', 'photos', 'a.jpg')), true);
  });

  it('knows nothing before the user chooses', () => {
    assert.strictEqual(isUserChosenFolder(folder), false);
    assert.strictEqual(isInUserChosenFolder(path.join(folder, 'a.jpg')), false);
  });
});
