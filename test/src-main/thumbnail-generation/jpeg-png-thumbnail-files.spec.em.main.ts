import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { setTimeout as delay } from 'timers/promises';
import {
  isLastModified,
  isThumbnailJpeg,
  maxThumbnailBytes,
  readPhotoForThumbnail,
  saveJpegPngThumbnail,
} from '../../../src-main/thumbnail-generation/jpeg-png-thumbnail-files.js';
import { ThumbnailCachePaths, thumbnailStates } from '../../../src-main/thumbnail-generation/thumbnail-state.js';
import { getThumbnailFilePath, getThumbnailLogFilePath } from '../../../src-shared/thumbnail/cache/thumbnail-cache-util.js';

describe('The files of the thumbnails that the page makes of JPEG and PNG photos (in main process)', () => {
  let root: string;
  /** A cache in a temporary folder, not the user's. */
  let cache: string;
  let cachePaths: ThumbnailCachePaths;
  let photo: string;
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const stateOf = (filePath: string, longerSide = 400) => thumbnailStates([filePath], longerSide, cachePaths)
    .map(({ attemptFinished, cacheAvailable }) => ({ attemptFinished, cacheAvailable }))[0];

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-jpeg-png-thumbnail-'));
    cache = path.join(root, 'cache');
    cachePaths = {
      thumbnailFilePath: srcFilePath => getThumbnailFilePath(srcFilePath, cache).thumbnailFilePath,
      logFilePath: srcFilePath => getThumbnailLogFilePath(srcFilePath, cache),
    };
    photo = path.join(root, 'photos', 'IMG_0001.JPG');
    fs.mkdirSync(path.dirname(photo));
    fs.writeFileSync(photo, 'the bytes of the photo');
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('reads a photo with the time that it was last modified, and nothing of a file that is not there, or of a folder', async () => {
    const read = await readPhotoForThumbnail(photo);
    assert.strictEqual(Buffer.from(read.bytes).toString(), 'the bytes of the photo');
    assert.strictEqual(read.lastModified, fs.statSync(photo).mtime.toISOString());
    assert.strictEqual(await readPhotoForThumbnail(path.join(root, 'photos', 'none.jpg')), null);
    assert.strictEqual(await readPhotoForThumbnail(path.dirname(photo)), null);
  });

  it('keeps a thumbnail, with the log of its generation for the photo as it was read, which the cache then has', async () => {
    const { lastModified } = await readPhotoForThumbnail(photo);
    const thumbnailFilePath = await saveJpegPngThumbnail(photo, lastModified, jpeg, 400, cache);

    assert.strictEqual(thumbnailFilePath, getThumbnailFilePath(photo, cache).thumbnailFilePath);
    assert.deepStrictEqual(new Uint8Array(fs.readFileSync(thumbnailFilePath)), jpeg);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(getThumbnailLogFilePath(photo, cache), 'utf8')),
      { LastModified: lastModified, IsThumbnailFileCreated: true, LongerSide: 400 });
    assert.deepStrictEqual(stateOf(photo), { attemptFinished: true, cacheAvailable: true });
  });

  it('keeps a thumbnail of another size in the same file, which the cache has at that size only', async () => {
    const { lastModified } = await readPhotoForThumbnail(photo);
    await saveJpegPngThumbnail(photo, lastModified, jpeg, 400, cache);
    const thumbnailFilePath = await saveJpegPngThumbnail(photo, lastModified, jpeg, 700, cache);

    assert.strictEqual(thumbnailFilePath, getThumbnailFilePath(photo, cache).thumbnailFilePath);
    assert.strictEqual(JSON.parse(fs.readFileSync(getThumbnailLogFilePath(photo, cache), 'utf8')).LongerSide, 700);
    assert.deepStrictEqual(stateOf(photo, 700), { attemptFinished: true, cacheAvailable: true });
    assert.deepStrictEqual(stateOf(photo, 400), { attemptFinished: false, cacheAvailable: false });
  });

  it('keeps that no thumbnail could be made, and lets the thumbnail of the photo as it was before go', async () => {
    await saveJpegPngThumbnail(photo, '2000-01-01T00:00:00.000Z', jpeg, 400, cache);
    const { lastModified } = await readPhotoForThumbnail(photo);
    const thumbnailFilePath = await saveJpegPngThumbnail(photo, lastModified, null, 400, cache);

    assert.strictEqual(fs.existsSync(thumbnailFilePath), false);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(getThumbnailLogFilePath(photo, cache), 'utf8')),
      { LastModified: lastModified, IsThumbnailFileCreated: false, LongerSide: 400 });
    assert.deepStrictEqual(stateOf(photo), { attemptFinished: true, cacheAvailable: false });
  });

  it('lets the previous log go before it writes the new thumbnail, so that a failure leaves no log of the previous size', async () => {
    const { lastModified } = await readPhotoForThumbnail(photo);
    await saveJpegPngThumbnail(photo, lastModified, jpeg, 400, cache);
    const writeFile = fs.promises.writeFile;
    fs.promises.writeFile = (async () => { throw new Error('The disk is full.'); }) as typeof fs.promises.writeFile;
    try {
      await assert.rejects(saveJpegPngThumbnail(photo, lastModified, jpeg, 700, cache), /The disk is full/);
    } finally {
      fs.promises.writeFile = writeFile;
    }
    assert.strictEqual(fs.existsSync(getThumbnailLogFilePath(photo, cache)), false);
    assert.deepStrictEqual(stateOf(photo, 400), { attemptFinished: false, cacheAvailable: false });
  });

  it('writes a thumbnail and its log before the next save of the photo starts, so that the log is of the thumbnail there', async () => {
    const { lastModified } = await readPhotoForThumbnail(photo);
    const logFilePath = getThumbnailLogFilePath(photo, cache);
    const jpegOf800 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 8, 0, 0]);
    let secondSaved: () => void;
    const isSecondSaved = new Promise<void>(resolve => secondSaved = resolve);
    // The first save's log is written once the second save has ended, or after a while, as the second waits for the
    // first: had it not, it would have written its thumbnail and its log meanwhile, and the first save's log, of 400,
    // would have been left beside the second's thumbnail, of 800.
    const writeFile = fs.promises.writeFile;
    let isFirstLog = true;
    fs.promises.writeFile = (async (...args: Parameters<typeof writeFile>) => {
      if (args[0] === logFilePath && isFirstLog) {
        isFirstLog = false;
        await Promise.race([isSecondSaved, delay(300)]);
      }
      return writeFile(...args);
    }) as typeof fs.promises.writeFile;
    try {
      const first = saveJpegPngThumbnail(photo, lastModified, jpeg, 400, cache);
      const second = saveJpegPngThumbnail(photo, lastModified, jpegOf800, 800, cache);
      void second.then(() => secondSaved());
      await Promise.all([first, second]);
    } finally {
      fs.promises.writeFile = writeFile;
    }

    assert.deepStrictEqual(new Uint8Array(fs.readFileSync(getThumbnailFilePath(photo, cache).thumbnailFilePath)), jpegOf800);
    assert.strictEqual(JSON.parse(fs.readFileSync(logFilePath, 'utf8')).LongerSide, 800);
    assert.deepStrictEqual(stateOf(photo, 800), { attemptFinished: true, cacheAvailable: true });
  });

  it('has no thumbnail in the cache for a photo changed since it was read for its thumbnail', async () => {
    await saveJpegPngThumbnail(photo, '2000-01-01T00:00:00.000Z', jpeg, 400, cache);
    assert.deepStrictEqual(stateOf(photo), { attemptFinished: false, cacheAvailable: false });
  });

  it('takes only a time as the photo was read with, and only a JPEG of the size of a thumbnail', () => {
    assert.strictEqual(isLastModified('2026-11-23T01:02:03.000Z'), true);
    for (const value of ['2026-11-23T01:02:03Z', '2026-11-23', 'yesterday', 1, null, undefined])
      assert.strictEqual(isLastModified(value), false, String(value));

    assert.strictEqual(isThumbnailJpeg(jpeg), true);
    const tooLarge = new Uint8Array(maxThumbnailBytes + 1);
    tooLarge.set([0xff, 0xd8, 0xff]);
    for (const value of [new Uint8Array([0x89, 0x50, 0x4e, 0x47]), new Uint8Array([0xff, 0xd8]), tooLarge, 'a JPEG', null])
      assert.strictEqual(isThumbnailJpeg(value), false);
  });
});
