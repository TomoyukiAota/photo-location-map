import * as fs from 'fs';
import * as pathModule from 'path';
import { createPrependedLogger } from '../../log/create-prepended-logger.js';
import { stringArrayToLogText } from '../../log/multiline-log-text.js';
import { getOriginalFilePath, plmThumbnailCacheDir } from './thumbnail-cache-util.js';
import { removeEmptyCacheDirectories } from './remove-empty-cache-directories.js';
import { logged } from '../../log/logged-line.js';

const logger = createPrependedLogger('[Invalid thumbnail cache removal]');

const thumbnailFileSuffix = '.plm.jpg';
const logFileSuffix = '.log.json';

let removalOfThisLaunch: Promise<void> | undefined;

/**
 * Removes the thumbnails of the cache whose photos are no longer there, once per launch of the app: when the first
 * thumbnail of the launch is made, by the page or by the main process.
 */
export function removeInvalidThumbnailCacheOncePerLaunch(): Promise<void> {
  removalOfThisLaunch ??= removeInvalidThumbnailCache();
  return removalOfThisLaunch;
}

/**
 * Removes the thumbnails and the logs of their generation, in the cache, whose photos are no longer there, then the
 * folders that it leaves empty. Never rejects: a failure is logged, as it does not stop the app from working.
 * TL;DR: Asynchronous, one file at a time, so that the main process goes on answering the page meanwhile.
 * Details:
 * - It read the whole cache synchronously, in the main process, whenever the main process started making the
 *   thumbnails of HEIF files, which was the only time that thumbnails were cached. The thumbnails of JPEG and PNG
 *   photos without one in their EXIF data are cached too now (src/app/jpeg-png-thumbnail/), so the cache can hold
 *   tens of thousands of files, and each check of a photo can be a file on a network drive.
 * - A log without a thumbnail, of an attempt that failed, is removed too, as it was not before.
 * - A photo counts as no longer there only when the file system says so (ENOENT, ENOTDIR), not when it cannot be
 *   checked, as when it may not be read: its thumbnail stays.
 */
export async function removeInvalidThumbnailCache(cacheDir = plmThumbnailCacheDir): Promise<void> {
  try {
    await tryRemoveInvalidThumbnailCache(cacheDir);
  } catch (error) {
    logger.warn(logged`Aborted the procedure of invalid thumbnail cache removal because error(s) are caught. Error: ${error}`, error);
    logger.warn('Swallowed the error(s) to continue application running because errors in invalid cache removal are negligible to the other features of this application.');
  }
}

async function tryRemoveInvalidThumbnailCache(cacheDir: string): Promise<void> {
  let numberOfFilesChecked = 0;
  const removedFilePaths: string[] = [];
  // The thumbnail and the log of a photo are in the same folder: its photo is checked once for both.
  let checkedDirectory: string | undefined;
  const isMissingByOriginal = new Map<string, boolean>();

  for await (const filePath of filesIn(cacheDir)) {
    const originalFilePath = originalFilePathOf(filePath, cacheDir);
    if (originalFilePath === undefined)
      continue;
    numberOfFilesChecked++;
    if (pathModule.dirname(filePath) !== checkedDirectory) {
      checkedDirectory = pathModule.dirname(filePath);
      isMissingByOriginal.clear();
    }
    let isMissing = isMissingByOriginal.get(originalFilePath);
    if (isMissing === undefined) {
      isMissing = await isNoLongerThere(originalFilePath);
      isMissingByOriginal.set(originalFilePath, isMissing);
    }
    if (isMissing && await removeFileInCacheDir(filePath, cacheDir))
      removedFilePaths.push(filePath);
  }

  if (removedFilePaths.length === 0) {
    logger.info(`All ${numberOfFilesChecked} files of the thumbnail cache are valid because the corresponding original files exist.`);
    return;
  }

  logger.info(`Removed ${removedFilePaths.length} of ${numberOfFilesChecked} files of the thumbnail cache, whose original files are not found.`);
  logger.debug(`The removed files are as follows:${stringArrayToLogText(removedFilePaths)}`);
  try {
    await removeEmptyCacheDirectories(cacheDir);
    logger.info('Successfully removed empty directories for thumbnail cache (if any).');
  } catch (error) {
    logger.warn(logged`Error occurred during removing empty directories for thumbnail cache. Error: ${error}`, error);
  }
}

/** The files in `directory` and in the folders in it, without following a link to a folder: the cache has none. */
async function* filesIn(directory: string): AsyncGenerator<string> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT')
      logger.warn(logged`Failed to read the directory "${directory}" of the thumbnail cache. Error: ${error}`, error);
    return;
  }
  for (const entry of entries) {
    const entryPath = pathModule.join(directory, entry.name);
    if (entry.isDirectory())
      yield* filesIn(entryPath);
    else if (entry.isFile())
      yield entryPath;
  }
}

/** The photo that a thumbnail or a log of the cache is of; undefined for any other file. */
function originalFilePathOf(filePath: string, cacheDir: string): string | undefined {
  if (filePath.endsWith(thumbnailFileSuffix))
    return getOriginalFilePath(filePath, cacheDir);
  // The log of "IMG_1.JPG" is "IMG_1.JPG.log.json", next to its thumbnail, "IMG_1.JPG.plm.jpg".
  if (filePath.endsWith(logFileSuffix))
    return getOriginalFilePath(filePath.slice(0, -logFileSuffix.length) + thumbnailFileSuffix, cacheDir);
  return undefined;
}

async function isNoLongerThere(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return false;
  } catch (error) {
    return error?.code === 'ENOENT' || error?.code === 'ENOTDIR';
  }
}

/** Removes a file of the cache, after making very sure that it is one. Whether it was removed. */
async function removeFileInCacheDir(filePath: string, cacheDir: string): Promise<boolean> {
  const isSomewhereInCacheDir = filePath.startsWith(cacheDir + pathModule.sep);
  if (!isSomewhereInCacheDir) {
    logger.error(logged`Tried to remove the file which is not in the cache directory. This is unsafe, so the file will not be removed. File path: "${filePath}"`);
    return false;
  }
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    if (error?.code !== 'ENOENT')
      logger.warn(logged`Failed to remove "${filePath}" of the thumbnail cache. Error: ${error}`, error);
    return false;
  }
}
