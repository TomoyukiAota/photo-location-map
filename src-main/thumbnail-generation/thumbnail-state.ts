import * as fs from 'fs';
import type { ThumbnailState } from '../../src-shared/bridge/plm-bridge.js';
import { Logger } from '../../src-shared/log/logger.js';
import { getThumbnailFilePath, getThumbnailLogFilePath } from '../../src-shared/thumbnail/cache/thumbnail-cache-util.js';
import { logged } from '../../src-shared/log/logged-line.js';

// TL;DR: Where the thumbnail of each HEIF file is, which the main window's page asks when it opens a folder and polls
// while thumbnails are made: the checks of thumbnail-cache-util.ts, which the renderer made itself until the main
// window was isolated, now made here for it.
// Details: Synchronous, as they were in the renderer: a file that was never attempted costs one check of its log,
// the others four small reads, so a folder's files take a few milliseconds. Made asynchronous at first, the checks
// of the large folder of the measurements took 34 ms more before the first open completed (series rer-2-C1), as each
// read waited for the thread pool. A file that cannot be checked, such as one deleted since the folder was opened, is
// reported as having no thumbnail, rather than failing the files with it.

/** Where a file's thumbnail and the log of its generation are: in the cache, or elsewhere for tests. */
export interface ThumbnailCachePaths {
  thumbnailFilePath(srcFilePath: string): string;
  logFilePath(srcFilePath: string): string;
}

const cachePaths: ThumbnailCachePaths = {
  thumbnailFilePath: srcFilePath => getThumbnailFilePath(srcFilePath).thumbnailFilePath,
  logFilePath: getThumbnailLogFilePath,
};

export function thumbnailStates(srcFilePaths: string[], paths: ThumbnailCachePaths = cachePaths): ThumbnailState[] {
  return srcFilePaths.map(srcFilePath => thumbnailState(srcFilePath, paths));
}

/**
 * Whether the thumbnail of `srcFilePath` was tried for the file as it is, and is cached; neither if that cannot be
 * read.
 */
function thumbnailState(srcFilePath: string, paths: ThumbnailCachePaths): ThumbnailState {
  const thumbnailFilePath = paths.thumbnailFilePath(srcFilePath);
  try {
    const attemptFinished = lastModifiedMatchesLogFile(srcFilePath, paths.logFilePath(srcFilePath));
    return { attemptFinished, cacheAvailable: attemptFinished && fs.existsSync(thumbnailFilePath), thumbnailFilePath };
  } catch (error) {
    Logger.warn(logged`Failed to check the thumbnail of "${srcFilePath}". error: ${error}`, error);
    return { attemptFinished: false, cacheAvailable: false, thumbnailFilePath };
  }
}

/** lastModifiedMatchBetweenSrcFileAndThumbnailGenerationLogFile of thumbnail-cache-util.ts, at another log's path. */
function lastModifiedMatchesLogFile(srcFilePath: string, logFilePath: string): boolean {
  if (!fs.existsSync(logFilePath))
    return false;

  let fileContentStr: string;
  try {
    fileContentStr = fs.readFileSync(logFilePath, 'utf8');
  } catch (error) {
    Logger.warn(logged`Failed to read the log file "${logFilePath}" which is the thumbnail generation result for "${srcFilePath}". error: ${error}`, error);
    return false;
  }

  let fileContentObj: { LastModified?: unknown };
  try {
    fileContentObj = JSON.parse(fileContentStr);
  } catch (error) {
    Logger.warn(logged`Failed to parse the content of the log file "${logFilePath}" as JSON format. The log file is for thumbnail generation result of "${srcFilePath}". error: ${error}`, error);
    return false;
  }

  const lastModifiedFromLogFile = fileContentObj?.LastModified;
  if (!lastModifiedFromLogFile)
    return false;

  const lastModifiedFromSrcFile = fs.statSync(srcFilePath).mtime.toISOString();
  return lastModifiedFromLogFile === lastModifiedFromSrcFile;
}
