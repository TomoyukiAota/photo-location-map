import assert from 'assert';
import * as path from 'path';
import { isFolderIn } from '../../script/build/remove-stale-output.js';

describe('remove-stale-output', () => {
  it('removes only a folder in out/, not out/ itself, nor one beside it or on another drive', () => {
    assert.strictEqual(isFolderIn('/repo/out', '/repo/out/app', path.posix), true);
    assert.strictEqual(isFolderIn('/repo/out', '/repo/out', path.posix), false);
    assert.strictEqual(isFolderIn('/repo/out', '/repo', path.posix), false);
    assert.strictEqual(isFolderIn('/repo/out', '/repo/outside', path.posix), false);
    assert.strictEqual(isFolderIn('C:\\repo\\out', 'C:\\repo\\out\\em', path.win32), true);
    // path.relative gives a folder on another drive as an absolute path, which does not start with "..".
    assert.strictEqual(isFolderIn('C:\\repo\\out', 'D:\\build-output', path.win32), false);
  });
});
