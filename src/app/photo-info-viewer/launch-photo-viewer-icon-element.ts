import { Analytics } from '../../../src-shared/analytics/analytics';
import { Photo } from '../shared/model/photo.model';
import { IconDataUrl } from '../../assets/icon-data-url';
import { PhotoViewerLauncher } from '../photo-viewer-launcher/photo-viewer-launcher';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';

export class LaunchPhotoViewerIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src = IconDataUrl.launchExternalApp;
    element.width = 25;
    element.height = 25;
    element.title = `Open ${photo.name}`;
    element.className = 'photo-info-viewer-button';
    element.onclick = () => this.handleLaunchPhotoViewerIconClick(photo);
    return element;
  }

  private static handleLaunchPhotoViewerIconClick(photo: Photo): void {
    logger.info(`Clicked the launch photo viewer icon for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Launch Photo Viewer Icon');
    PhotoViewerLauncher.launch(photo);
  }
}
