import * as deleteEmpty from 'delete-empty';
import * as createDirectoryTree from 'directory-tree';
import * as fs from 'fs';
import { convertToFlattenedDirTree } from '../dir-tree/dir-tree-util';
import { createSpecificLogger } from '../log/create-specific-logger';
import { getOriginalFilePath, getThumbnailLogFilePath, plmThumbnailCacheDir } from './thumbnail-cache-util';

const logger = createSpecificLogger('[Invalid thumbnail cache removal]');

export function removeInvalidThumbnailCache(): void {
  try {
    tryRemoveInvalidThumbnailCache();
  } catch (error) {
    logger.warn(`Caught error(s) during invalid thumbnail cache removal. Error: ${error}`, error);
    logger.warn('Swallowing the error to continue application running because errors in invalid cache removal are not critical.');
  }
}

function tryRemoveInvalidThumbnailCache() {
  const directoryTreeObject = createDirectoryTree(plmThumbnailCacheDir);
  const flattenedDirTree = convertToFlattenedDirTree(directoryTreeObject);
  const thumbnailFilePaths = flattenedDirTree
    .filter(element => element.path.match(/.+\.plm\.jpg$/))
    .map(element => element.path);

  if (thumbnailFilePaths.length === 0) {
    logger.info('Thumbnail cache files do not exist.');
    return;
  }

  logger.debug('Following thumbnail files exist as cache:');
  thumbnailFilePaths.forEach(filePath => logger.debug(filePath));

  const cacheFilePathsWithoutOriginalFiles = thumbnailFilePaths
    .filter(thumbnailFilePath => {
      const originalFilePath = getOriginalFilePath(thumbnailFilePath);
      return !fs.existsSync(originalFilePath);
    });

  if (cacheFilePathsWithoutOriginalFiles.length === 0) {
    logger.info(`All thumbnail cache files are valid because the corresponding original files exist.`);
    return;
  }

  logger.info('The corresponding original files are not found for the following thumbnail cache files:');
  cacheFilePathsWithoutOriginalFiles.forEach(filePath => logger.info(filePath));
  logger.info('The thumbnail cache files without corresponding original files are invalid. Removing the invalid cache...');
  cacheFilePathsWithoutOriginalFiles.forEach(filePath => fs.unlinkSync(filePath));

  const invalidCacheFilesStillExist = cacheFilePathsWithoutOriginalFiles.filter(filePath => fs.existsSync(filePath)).length > 0;
  if (invalidCacheFilesStillExist) {
    logger.warn('Invalid thumbnail cache files still exist after trying to remove them. Aborting the procedure of removing invalid thumbnail cache files.');
    return;
  } else {
    logger.info('Successfully removed all invalid thumbnail cache files.');
  }

  const invalidLogFiles = cacheFilePathsWithoutOriginalFiles
    .map(thumbnailFilePath => {
      const originalFilePath = getOriginalFilePath(thumbnailFilePath);
      return getThumbnailLogFilePath(originalFilePath);
    })
    .filter(logFilePath => fs.existsSync(logFilePath));

  if (invalidLogFiles.length === 0) {
    logger.info('The log files for the thumbnail cache are not found.');
    return;
  }

  logger.info('Following log files for the thumbnail cache are invalid since the thumbnail cache file is invalid:');
  invalidLogFiles.forEach(logFile => logger.info(logFile));
  logger.info('Removing the invalid log files...');
  invalidLogFiles.forEach(logFile => fs.unlinkSync(logFile));

  const invalidLogFilesStillExist = invalidLogFiles.filter(filePath => fs.existsSync(filePath)).length > 0;
  if (invalidLogFilesStillExist) {
    logger.warn('Invalid log files for the thumbnail cache still exist after trying to remove them. Aborting the procedure of removing invalid log files.');
    return;
  } else {
    logger.info('Successfully removed all invalid log files for the thumbnail cache.');
  }

  logger.info('Removing empty directories (if any) after removal of invalid thumbnail cache...');

  try {
    deleteEmpty.sync(plmThumbnailCacheDir);
    logger.info('Successfully removed empty directories for thumbnail cache (if any).');
  } catch (error) {
    logger.warn(`Error occurred during removing empty directories for thumbnail cache. Error: ${error}`, error);
  }
}