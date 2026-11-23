import * as fs from 'fs';
import type { PhotoFileForThumbnail } from '../../src-shared/bridge/plm-bridge.js';
import { createPrependedLogger } from '../../src-shared/log/create-prepended-logger.js';
import { logged } from '../../src-shared/log/logged-line.js';
import { createThumbnailGenerationLogFile, getThumbnailFilePath, plmThumbnailCacheDir } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';

// TL;DR: The files of the thumbnails that the main window's page makes of JPEG and PNG photos
// (src/app/jpeg-png-thumbnail/): the main process reads a photo for the page, and keeps the thumbnail that the page
// made of it in the cache, beside those of HEIF photos, with the log of its generation, which holds its size.
// Details: The page decodes the photo itself, with Chromium's decoder, which it reaches only from a page; the main
// process only reads and writes files, as the page cannot. The log holds the time that the photo had when it was
// read, so that a photo changed while its thumbnail was made gets a new one the next time, not the old one
// (src-main/thumbnail-generation/thumbnail-state.ts).

const logger = createPrependedLogger('[JPEG/PNG Thumbnail]');

/** The largest thumbnail that the page may keep: one of 400 pixels is 50 to 100 KB, one of 1,000 about 300 to 500 KB. */
export const maxThumbnailBytes = 2 * 1024 * 1024;

/** The photo's file, and the time that it was last modified, as it is now; null when it cannot be read. */
export async function readPhotoForThumbnail(filePath: string): Promise<PhotoFileForThumbnail | null> {
  let file: fs.promises.FileHandle | undefined;
  try {
    file = await fs.promises.open(filePath, 'r');
    const stats = await file.stat();
    if (!stats.isFile())
      return null;
    const bytes = await file.readFile();
    return { bytes, lastModified: stats.mtime.toISOString() };
  } catch (error) {
    logger.info(logged`The photo "${filePath}" cannot be read for its thumbnail: ${error}`);
    return null;
  } finally {
    await file?.close().catch(() => {});
  }
}

/**
 * Writes the thumbnail of the photo at `srcFilePath`, made from the file as it was at `lastModified`, at `longerSide`,
 * into the cache, then the log of its generation; with `jpeg` null, only the log, which says that none could be made,
 * and the photo's previous thumbnail, of an earlier version of the file or of another size, is removed. Resolves with
 * where the thumbnail is. The cache is the app's unless a test gives another.
 */
export async function saveJpegPngThumbnail(srcFilePath: string, lastModified: string, jpeg: Uint8Array | null,
                                           longerSide: number, cacheDir = plmThumbnailCacheDir): Promise<string> {
  const { thumbnailFileDir, thumbnailFilePath } = getThumbnailFilePath(srcFilePath, cacheDir);
  await fs.promises.mkdir(thumbnailFileDir, { recursive: true });
  if (jpeg)
    await fs.promises.writeFile(thumbnailFilePath, jpeg);
  else
    await fs.promises.rm(thumbnailFilePath, { force: true });
  await createThumbnailGenerationLogFile(srcFilePath, thumbnailFileDir, !!jpeg, logger, lastModified, longerSide);
  return thumbnailFilePath;
}

/** Whether `value` is a time as readPhotoForThumbnail gives it. */
export function isLastModified(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
}

/** Whether `value` is a thumbnail that the page may keep: a JPEG, as its first bytes say, of a sensible size. */
export function isThumbnailJpeg(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array && value.length >= 3 && value.length <= maxThumbnailBytes
    && value[0] === 0xff && value[1] === 0xd8 && value[2] === 0xff;
}
