import * as fs from 'fs';
import type { ThumbnailState } from '../../src-shared/bridge/plm-bridge';
import { Logger } from '../../src-shared/log/logger';
import { getThumbnailFilePath, getThumbnailLogFilePath } from '../../src-shared/thumbnail/cache/thumbnail-cache-util';

// TL;DR: Where the thumbnail of each HEIF file is, which the main window's page polls while thumbnails are made: the
// checks of thumbnail-cache-util.ts, made asynchronously.
// Details: The page made these checks synchronously, in the renderer, until the main window was isolated. Asynchronous
// here, so that the checks of a large folder every few seconds do not hold up the main process's event loop. A file
// that cannot be checked, such as one deleted since the folder was opened, is reported as having no thumbnail
// rather than failing the files with it.

/** Where a file's thumbnail and the log of its generation are: in the cache, or elsewhere for tests. */
export interface ThumbnailCachePaths {
  thumbnailFilePath(srcFilePath: string): string;
  logFilePath(srcFilePath: string): string;
}

const cachePaths: ThumbnailCachePaths = {
  thumbnailFilePath: srcFilePath => getThumbnailFilePath(srcFilePath).thumbnailFilePath,
  logFilePath: getThumbnailLogFilePath,
};

export function thumbnailStates(srcFilePaths: string[], paths: ThumbnailCachePaths = cachePaths): Promise<ThumbnailState[]> {
  return Promise.all(srcFilePaths.map(srcFilePath => thumbnailState(srcFilePath, paths)));
}

async function thumbnailState(srcFilePath: string, paths: ThumbnailCachePaths): Promise<ThumbnailState> {
  const thumbnailFilePath = paths.thumbnailFilePath(srcFilePath);
  let attemptFinished = false;
  let cacheAvailable = false;
  try {
    attemptFinished = await lastModifiedMatchesLogFile(srcFilePath, paths.logFilePath(srcFilePath));
    cacheAvailable = attemptFinished && await exists(thumbnailFilePath);
  } catch (error) {
    Logger.warn(`Failed to check the thumbnail of "${srcFilePath}". error: ${error}`, error);
  }
  return { attemptFinished, cacheAvailable, thumbnailFilePath };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** lastModifiedMatchBetweenSrcFileAndThumbnailGenerationLogFile of thumbnail-cache-util.ts. */
async function lastModifiedMatchesLogFile(srcFilePath: string, logFilePath: string): Promise<boolean> {
  let fileContentStr: string;
  try {
    fileContentStr = await fs.promises.readFile(logFilePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT')
      Logger.warn(`Failed to read the log file "${logFilePath}" which is the thumbnail generation result for "${srcFilePath}". error: ${error}`, error);
    return false;
  }

  let fileContentObj: { LastModified?: unknown };
  try {
    fileContentObj = JSON.parse(fileContentStr);
  } catch (error) {
    Logger.warn(`Failed to parse the content of the log file "${logFilePath}" as JSON format. The log file is for thumbnail generation result of "${srcFilePath}". error: ${error}`, error);
    return false;
  }

  const lastModifiedFromLogFile = fileContentObj?.LastModified;
  if (!lastModifiedFromLogFile)
    return false;

  const lastModifiedFromSrcFile = (await fs.promises.stat(srcFilePath)).mtime.toISOString();
  return lastModifiedFromLogFile === lastModifiedFromSrcFile;
}
