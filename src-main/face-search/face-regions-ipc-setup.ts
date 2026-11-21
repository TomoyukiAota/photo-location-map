import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { assertFromMainWindow } from '../ipc/ipc-sender.js';
import { isInUserChosenFolder } from '../ipc/user-chosen-folders.js';
import { hasFaceRegion } from './face-regions.js';

/** The most photos that one request asks about (src/app/face-search/face-search.service.ts sends them in batches). */
export const maxFaceRegionPathsPerRequest = 100;

// The photos of a folder that the user opened, whose metadata the search for faces reads first.
ipcMain.handle(IpcConstants.FaceRegions.Have, (event, filePaths: unknown) => {
  assertFromMainWindow(event, 'Reading face regions');
  if (!Array.isArray(filePaths) || filePaths.length > maxFaceRegionPathsPerRequest || !filePaths.every(isInUserChosenFolder))
    throw new Error(`Reading face regions needs up to ${maxFaceRegionPathsPerRequest} paths of files in folders that the user opened.`);
  return Promise.all(filePaths.map(hasFaceRegion));
});
