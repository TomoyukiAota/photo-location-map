import { createPrependedLogger } from '../log/create-prepended-logger';
import { PhotoDataViewerIpcPhotoParams } from './photo-data-viewer-ipc-params';

export const photoDataViewerLogger = createPrependedLogger('[Photo Data Viewer]');

export function logWindowBounds(bounds: Electron.Rectangle, photo: PhotoDataViewerIpcPhotoParams) {
  if (!bounds) { return; }

  const {x, y, width, height} = bounds;
  photoDataViewerLogger.info(`Window Bounds { x: ${x}, y: ${y}, width: ${width}, height: ${height} } for ${photo?.path}`);
}
