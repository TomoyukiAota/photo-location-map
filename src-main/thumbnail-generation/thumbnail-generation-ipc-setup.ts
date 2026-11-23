import { ipcMain } from 'electron';
import * as path from 'path';
import { FilenameExtension } from '../../src-shared/filename-extension/filename-extension.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { removeInvalidThumbnailCacheOncePerLaunch } from '../../src-shared/thumbnail/cache/remove-invalid-thumbnail-cache.js';
import { thumbnailGenerationLogger as logger } from '../../src-shared/thumbnail/generation/thumbnail-generation-logger.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { isLastModified, isThumbnailJpeg, readPhotoForThumbnail, saveJpegPngThumbnail } from './jpeg-png-thumbnail-files.js';
import { cancelThumbnailGeneration, handleThumbnailGenerationIpcRequest } from './thumbnail-generation.js';
import { thumbnailStates } from './thumbnail-state.js';

/** A JPEG or PNG photo of a folder that the user opened, whose thumbnail the page makes. */
function assertJpegOrPngInUserChosenFolder(filePath: unknown, operation: string): asserts filePath is string {
  if (!isInUserChosenFolder(filePath) || !FilenameExtension.isDisplayableInBrowser(path.extname(filePath).toLowerCase()))
    throw new Error(`${operation} needs the path of a JPEG or PNG file in a folder that the user opened.`);
}

/** The photos of a folder that the user opened, which the page asks about: HEIF, JPEG or PNG files. */
function assertFilesInUserChosenFolders(filePaths: unknown, operation: string): asserts filePaths is string[] {
  if (!Array.isArray(filePaths) || !filePaths.every(filePath => isInUserChosenFolder(filePath)))
    throw new Error(`${operation} needs the paths of files in a folder that the user opened.`);
}

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, allHeifFilePaths: unknown, heifFilePathsToGenerateThumbnail: unknown) => {
  logger.debug(`[IPC Main Received] ${IpcConstants.ThumbnailGenerationInMainProcess.Name}`);
  assertFromMainWindow(event, 'Making thumbnails');
  assertFilesInUserChosenFolders(allHeifFilePaths, 'Making thumbnails');
  assertFilesInUserChosenFolders(heifFilePathsToGenerateThumbnail, 'Making thumbnails');
  handleThumbnailGenerationIpcRequest(allHeifFilePaths, heifFilePathsToGenerateThumbnail);
});

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Cancel, event => {
  assertFromMainWindow(event, 'Cancelling the generation of thumbnails');
  cancelThumbnailGeneration();
});

ipcMain.handle(IpcConstants.ThumbnailCache.State, (event, filePaths: unknown) => {
  assertFromMainWindow(event, 'Reading the thumbnail cache');
  assertFilesInUserChosenFolders(filePaths, 'Reading the thumbnail cache');
  return thumbnailStates(filePaths);
});

ipcMain.handle(IpcConstants.JpegPngThumbnail.ReadPhoto, (event, filePath: unknown) => {
  assertFromMainWindow(event, 'Reading a photo for its thumbnail');
  assertJpegOrPngInUserChosenFolder(filePath, 'Reading a photo for its thumbnail');
  return readPhotoForThumbnail(filePath);
});

ipcMain.handle(IpcConstants.JpegPngThumbnail.Save, (event, filePath: unknown, lastModified: unknown, jpeg: unknown) => {
  assertFromMainWindow(event, 'Keeping the thumbnail of a photo');
  assertJpegOrPngInUserChosenFolder(filePath, 'Keeping the thumbnail of a photo');
  if (!isLastModified(lastModified))
    throw new Error('Keeping the thumbnail of a photo needs the time that the photo had when it was read.');
  if (jpeg !== null && !isThumbnailJpeg(jpeg))
    throw new Error('Keeping the thumbnail of a photo needs a JPEG of a thumbnail, or null.');
  // The first thumbnail of the launch, which the page made, has the thumbnails of photos no longer there removed.
  void removeInvalidThumbnailCacheOncePerLaunch();
  return saveJpegPngThumbnail(filePath, lastModified, jpeg as Uint8Array | null);
});
