import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { openTargetOf } from '../../../src-main/command-line-options/setup-ipc-main-for-command-line-options.js';

describe('openTargetOf (in main process)', () => {
  let root: string;
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-open-target-'));
    fs.writeFileSync(path.join(root, 'a.jpg'), '');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

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
});
