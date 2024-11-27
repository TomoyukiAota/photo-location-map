import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { thumbnailGenerationLogger as logger } from '../../src-shared/thumbnail/generation/thumbnail-generation-logger';
import { handleThumbnailGenerationIpcRequest } from './thumbnail-generation';

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, allHeifFilePaths: string[], heifFilePathsToGenerateThumbnail: string[]) => {
  logger.debug(`[IPC Main Received] ${IpcConstants.ThumbnailGenerationInMainProcess.Name}`);
  handleThumbnailGenerationIpcRequest(allHeifFilePaths, heifFilePathsToGenerateThumbnail);
});
