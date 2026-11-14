import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { thumbnailGenerationLogger as logger } from '../../src-shared/thumbnail/generation/thumbnail-generation-logger.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { handleThumbnailGenerationIpcRequest } from './thumbnail-generation.js';
import { thumbnailStates } from './thumbnail-state.js';

/** The HEIF files of a folder that the user opened, which the page asks about. */
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

ipcMain.handle(IpcConstants.ThumbnailCache.State, (event, filePaths: unknown) => {
  assertFromMainWindow(event, 'Reading the thumbnail cache');
  assertFilesInUserChosenFolders(filePaths, 'Reading the thumbnail cache');
  return thumbnailStates(filePaths);
});
