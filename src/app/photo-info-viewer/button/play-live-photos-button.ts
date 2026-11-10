import { Analytics } from '../../../../src-shared/analytics/analytics';
import { t } from '../../../../src-shared/i18n/i18n';
import { openWithAssociatedApp } from '../../shared/open-with-os';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { OpenedDirectory } from '../../shared/opened-directory';
import { photoInfoViewerLogger as logger } from '../photo-info-viewer-logger';
import { createPhotoInfoViewerButton } from './photo-info-viewer-button-util';


export class PlayLivePhotosButton {
  public static create(photo: Photo): HTMLButtonElement {
    const {livePhotosAvailable, livePhotosFilePath} = OpenedDirectory.getLivePhotosFilePathIfAvailable(photo.path);
    if (!livePhotosAvailable)
      return null;

    const onClick = () => this.handleButtonClick(livePhotosFilePath, photo);
    const button = createPhotoInfoViewerButton(onClick, IconDataUrl.play, t('photoInfo.livePhotos'));
    return button;
  }

  private static handleButtonClick(livePhotosFilePath: string, photo: Photo): void {
    logger.info(`Clicked the play live photos button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Play Live Photos Button');
    openWithAssociatedApp(livePhotosFilePath);
  }
}
