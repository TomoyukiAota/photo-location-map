import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { removeInvalidThumbnailCache } from '../../../src-shared/thumbnail/cache/remove-invalid-thumbnail-cache.js';
import { getThumbnailFilePath, getThumbnailLogFilePath } from '../../../src-shared/thumbnail/cache/thumbnail-cache-util.js';

describe('removeInvalidThumbnailCache', () => {
  let root: string;
  /** A cache in a temporary folder, not the user's. */
  let cache: string;
  const thumbnailOf = (photo: string) => getThumbnailFilePath(photo, cache).thumbnailFilePath;
  const logOf = (photo: string) => getThumbnailLogFilePath(photo, cache);
  /** Writes what the cache holds of a photo: its log, and its thumbnail unless its generation failed. */
  function cacheFilesOf(photo: string, { failed = false } = {}): void {
    fs.mkdirSync(path.dirname(logOf(photo)), { recursive: true });
    fs.writeFileSync(logOf(photo), JSON.stringify({ LastModified: '2026-11-23T01:02:03.000Z', IsThumbnailFileCreated: !failed }));
    if (!failed)
      fs.writeFileSync(thumbnailOf(photo), 'jpeg');
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-invalid-cache-'));
    cache = path.join(root, 'cache');
    fs.mkdirSync(path.join(root, 'photos'));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('removes the files of the photos no longer there, failed ones too, and the folders that it leaves empty, and keeps the others', async () => {
    const kept = path.join(root, 'photos', 'kept.jpg');
    const keptFailed = path.join(root, 'photos', 'kept-failed.png');
    for (const photo of [kept, keptFailed])
      fs.writeFileSync(photo, 'photo');
    const gone = path.join(root, 'photos', 'gone.jpg');
    const goneFailed = path.join(root, 'photos', 'gone-failed.jpg');
    const goneFolder = path.join(root, 'gone-folder', 'IMG_0001.HEIC');
    cacheFilesOf(kept);
    cacheFilesOf(keptFailed, { failed: true });
    cacheFilesOf(gone);
    cacheFilesOf(goneFailed, { failed: true });
    cacheFilesOf(goneFolder);
    // A file of the cache that is neither a thumbnail nor a log, which is not the app's to remove.
    const other = path.join(path.dirname(thumbnailOf(kept)), 'notes.txt');
    fs.writeFileSync(other, 'notes');

    await removeInvalidThumbnailCache(cache);

    for (const filePath of [thumbnailOf(kept), logOf(kept), logOf(keptFailed), other])
      assert.strictEqual(fs.existsSync(filePath), true, filePath);
    for (const filePath of [thumbnailOf(gone), logOf(gone), logOf(goneFailed), path.dirname(thumbnailOf(goneFolder))])
      assert.strictEqual(fs.existsSync(filePath), false, filePath);
  });

  it('accepts a cache that is not there', async () => {
    await assert.doesNotReject(() => removeInvalidThumbnailCache(path.join(root, 'absent')));
  });
});
