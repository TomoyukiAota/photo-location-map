import { Analytics } from '../../../src-shared/analytics/analytics';
import { countBy, countsLabel } from '../../../src-shared/analytics/counts-label';
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

    // Which cameras users shoot with: the number of photos per camera make, as written in EXIF.
    const photoCountsByCameraMake = countBy(photos.map(photo => photo.exif?.cameraMake || '(none)'));
    Logger.info(`Photos by camera make: `, photoCountsByCameraMake);
    Analytics.trackEvent('Opened Folder Info', 'Opened Folder: Camera Makes', countsLabel(photoCountsByCameraMake));
  }
}
