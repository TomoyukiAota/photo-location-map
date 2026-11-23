import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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
