import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { handleThumbnailGenerationIpcRequest } from './thumbnail-generation';

ipcMain.handle(IpcConstants.ThumbnailGenerationInMainProcess.Name, (event, allHeifFilePaths: string[], heifFilePathsToGenerateThumbnail: string[]) => {
  Logger.info(`Received the IPC invoke request about thumbnail generation in the main process.`);
  handleThumbnailGenerationIpcRequest(allHeifFilePaths, heifFilePathsToGenerateThumbnail);
});
