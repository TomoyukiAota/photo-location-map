import { Analytics } from '../../../src-shared/analytics/analytics';
import { Photo } from '../shared/model/photo.model';
import { IconDataUrl } from '../../assets/icon-data-url';
import { PhotoViewerLauncher } from '../photo-viewer-launcher/photo-viewer-launcher';
import { createPhotoInfoViewerButton } from "./photo-info-viewer-button";
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';

export class LaunchPhotoViewerButton {
  public static create(photo: Photo): HTMLButtonElement {
    const onClick = () => this.handleButtonClick(photo);
    const button = createPhotoInfoViewerButton(onClick, IconDataUrl.launchExternalApp, 'Open File');
    return button;
  }

  private static handleButtonClick(photo: Photo): void {
    logger.info(`Clicked the launch photo viewer button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Launch Photo Viewer Button');
    PhotoViewerLauncher.launch(photo);
  }
}
