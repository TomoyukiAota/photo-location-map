import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from './model/photo.model';

export class PathPhotoMapRecorder {
  public static record(pathPhotoMap: Map<string, Photo>): void {
    const photos = Array.from(pathPhotoMap.values());

    const numOfPhotosWithExif = photos.filter(photo => !!photo.exif).length;
    const numOfPhotosWithGpsInfo = photos.filter(photo => !!photo.exif?.gpsInfo).length;

    Logger.info(`Number of files with EXIF: ${numOfPhotosWithExif}`);
    Logger.info(`Number of files with GPS info: ${numOfPhotosWithGpsInfo}`);

    Analytics.trackEvent('Opened Folder Info', 'Opened Folder: Files with EXIF', `Files with EXIF: ${numOfPhotosWithExif}`);
    Analytics.trackEvent('Opened Folder Info', 'Opened Folder: Files with GPS Info', `Files with GPS Info: ${numOfPhotosWithGpsInfo}`);
  }
}
