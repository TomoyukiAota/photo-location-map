import { createPrependedLogger } from '../../../../../src-shared/log/create-prepended-logger';
import { Photo } from '../../../shared/model/photo.model';

export const photoDataViewerLogger = createPrependedLogger('[Photo Data Viewer]');

export function logWindowBounds(bounds: Electron.Rectangle, photo: Photo) {
  if (!bounds) { return; }

  const {x, y, width, height} = bounds;
  photoDataViewerLogger.info(`Window Bounds { x: ${x}, y: ${y}, width: ${width}, height: ${height} } for ${photo?.path}`);
}
