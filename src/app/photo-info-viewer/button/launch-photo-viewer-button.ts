import { Analytics } from '../../../../src-shared/analytics/analytics';
import { t } from '../../../../src-shared/i18n/i18n';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { PhotoViewerLauncher } from '../../photo-viewer-launcher/photo-viewer-launcher';
import { photoInfoViewerLogger as logger } from '../photo-info-viewer-logger';
import { createPhotoInfoViewerButton } from './photo-info-viewer-button-util';

export class LaunchPhotoViewerButton {
  public static create(photo: Photo): HTMLButtonElement {
    const onClick = () => this.handleButtonClick(photo);
    const button = createPhotoInfoViewerButton(onClick, IconDataUrl.launchExternalApp, t('photoInfo.openFile'));
    return button;
  }

  private static handleButtonClick(photo: Photo): void {
    logger.info(`Clicked the launch photo viewer button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Launch Photo Viewer Button');
    PhotoViewerLauncher.launch(photo);
  }
}
