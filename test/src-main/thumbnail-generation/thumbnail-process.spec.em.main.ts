import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ThumbnailFileGenerationArg } from '../../../src-main/thumbnail-generation/generate-thumbnail-file-arg-and-result.js';
import { ThumbnailFailures } from '../../../src-main/thumbnail-generation/thumbnail-failures.js';
import { generateThumbnailAndLog, generateThumbnailInProcess } from '../../../src-main/thumbnail-generation/thumbnail-generation.js';

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
    // A worker that makes the thumbnail, and one that fails to decode the photo, writing nothing, as the app's do.
    fs.writeFileSync(path.join(folder, 'making-worker.mjs'), "import { writeFileSync } from 'fs';\n"
      + "process.parentPort.once('message', ({ data }) => { writeFileSync(data.outputFilePath, 'new'); "
      + "process.parentPort.postMessage({ status: 'success' }); });\n");
    fs.writeFileSync(path.join(folder, 'failing-worker.mjs'), "process.parentPort.once('message', () => "
      + "process.parentPort.postMessage({ status: 'failed-in-heic-convert', error: 'Error: cannot decode' }));\n");
    // A worker that takes a while to make the thumbnail, which holds its size, and says when it starts and ends.
    fs.writeFileSync(path.join(folder, 'slow-making-worker.mjs'), "import { appendFileSync, writeFileSync } from 'fs';\n"
      + "import { join } from 'path';\n"
      + "process.parentPort.once('message', ({ data }) => {\n"
      + "  const events = join(data.outputFileDir, 'events.txt');\n"
      + "  appendFileSync(events, `started ${data.longerSide}\\n`);\n"
      + "  setTimeout(() => {\n"
      + "    writeFileSync(data.outputFilePath, String(data.longerSide));\n"
      + "    appendFileSync(events, `ended ${data.longerSide}\\n`);\n"
      + "    process.parentPort.postMessage({ status: 'success' });\n"
      + "  }, 300);\n"
      + "});\n");
  });

  after(() => fs.rmSync(folder, { recursive: true, force: true }));

  it('sends the worker its file, and resolves with what the worker sends back', async () => {
    const result = await generateThumbnailInProcess(arg as never, path.join(folder, 'answering-worker.mjs'));
    assert.deepStrictEqual(result, { status: 'success', srcFilePath: '/photos/IMG_0001.HEIC' });
  });

  describe('generateThumbnailAndLog, for a photo whose thumbnail of 400 pixels is in the cache, at 800', () => {
    let cache: string;
    let photo: string;
    let next: ThumbnailFileGenerationArg;
    const thumbnail = () => path.join(cache, 'IMG_0001.HEIC.plm.jpg');
    const log = () => path.join(cache, 'IMG_0001.HEIC.log.json');

    beforeEach(() => {
      cache = fs.mkdtempSync(path.join(folder, 'cache-'));
      photo = path.join(cache, 'IMG_0001.HEIC');
      fs.writeFileSync(photo, 'the photo');
      fs.writeFileSync(thumbnail(), 'previous');
      fs.writeFileSync(log(), JSON.stringify({ LastModified: fs.statSync(photo).mtime.toISOString(), IsThumbnailFileCreated: true, LongerSide: 400 }));
      next = { srcFilePath: photo, outputFileDir: cache, outputFilePath: thumbnail(), longerSide: 800 };
    });

    it('keeps the thumbnail that the worker made, with a log of its size', async () => {
      await generateThumbnailAndLog(next, new ThumbnailFailures(), path.join(folder, 'making-worker.mjs'));
      assert.strictEqual(fs.readFileSync(thumbnail(), 'utf8'), 'new');
      assert.deepStrictEqual(JSON.parse(fs.readFileSync(log(), 'utf8')),
        { LastModified: fs.statSync(photo).mtime.toISOString(), IsThumbnailFileCreated: true, LongerSide: 800 });
    });

    it('leaves neither the previous thumbnail nor a log that says that one was made, when the worker fails', async () => {
      await generateThumbnailAndLog(next, new ThumbnailFailures(), path.join(folder, 'failing-worker.mjs'));
      assert.strictEqual(fs.existsSync(thumbnail()), false);
      assert.deepStrictEqual(JSON.parse(fs.readFileSync(log(), 'utf8')),
        { LastModified: fs.statSync(photo).mtime.toISOString(), IsThumbnailFileCreated: false, LongerSide: 800 });
    });

    it('makes the thumbnails of the photo at two sizes one after the other, which leaves the second with its log', async () => {
      const worker = path.join(folder, 'slow-making-worker.mjs');
      await Promise.all([600, 800].map(longerSide => generateThumbnailAndLog({ ...next, longerSide }, new ThumbnailFailures(), worker)));
      assert.strictEqual(fs.readFileSync(path.join(cache, 'events.txt'), 'utf8'), 'started 600\nended 600\nstarted 800\nended 800\n');
      assert.strictEqual(fs.readFileSync(thumbnail(), 'utf8'), '800');
      assert.strictEqual(JSON.parse(fs.readFileSync(log(), 'utf8')).LongerSide, 800);
    });
  });

  it('rejects when the worker ends without sending a result, as when it crashes', async () => {
    await assert.rejects(generateThumbnailInProcess(arg as never, path.join(folder, 'crashing-worker.mjs')),
      /exited with code 3 without sending a result/);
    await assert.rejects(generateThumbnailInProcess(arg as never, path.join(folder, 'silent-worker.mjs')),
      /exited with code 0 without sending a result/);
  });
});
