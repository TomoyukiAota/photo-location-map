import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateThumbnailInProcess } from '../../../src-main/thumbnail-generation/thumbnail-generation.js';

describe('generateThumbnailInProcess (in main process)', () => {
  const arg = { srcFilePath: '/photos/IMG_0001.HEIC', outputFileDir: '/cache', outputFilePath: '/cache/IMG_0001.jpg' };
  let folder: string;

  before(() => {
    // Workers that stand in for the app's, as ES modules (.mjs, as the folder has no package.json).
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-thumbnail-process-'));
    fs.writeFileSync(path.join(folder, 'answering-worker.mjs'), "process.parentPort.once('message', ({ data }) => "
      + "process.parentPort.postMessage({ status: 'success', srcFilePath: data.srcFilePath }));\n");
    fs.writeFileSync(path.join(folder, 'crashing-worker.mjs'), 'process.exit(3);\n');
    fs.writeFileSync(path.join(folder, 'silent-worker.mjs'), "process.parentPort.once('message', () => process.exit(0));\n");
  });

  after(() => fs.rmSync(folder, { recursive: true, force: true }));

  it('sends the worker its file, and resolves with what the worker sends back', async () => {
    const result = await generateThumbnailInProcess(arg as never, path.join(folder, 'answering-worker.mjs'));
    assert.deepStrictEqual(result, { status: 'success', srcFilePath: '/photos/IMG_0001.HEIC' });
  });

  it('rejects when the worker ends without sending a result, as when it crashes', async () => {
    await assert.rejects(generateThumbnailInProcess(arg as never, path.join(folder, 'crashing-worker.mjs')),
      /exited with code 3 without sending a result/);
    await assert.rejects(generateThumbnailInProcess(arg as never, path.join(folder, 'silent-worker.mjs')),
      /exited with code 0 without sending a result/);
  });
});
