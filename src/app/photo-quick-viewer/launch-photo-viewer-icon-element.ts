import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from '../shared/model/photo.model';
import { IconDataUrl } from '../../assets/icon-data-url';
import { PhotoViewerLauncher } from '../photo-viewer/photo-viewer-launcher';

export class LaunchPhotoViewerIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src     = IconDataUrl.launchExternalApp;
    element.width = 25;
    element.height = 25;
    element.title = `Open ${photo.name}`;
    element.className = 'photo-quick-viewer-button';
    element.onclick = () => this.handleLaunchPhotoViewerIconClick(photo);
    return element;
  }

  private static handleLaunchPhotoViewerIconClick(photo: Photo): void {
    Logger.info(`Photo Quick Viewer: Clicked the launch photo viewer icon for ${photo.path}`);
    Analytics.trackEvent('Photo Quick Viewer', 'Clicked Launch Photo Viewer Icon');
    PhotoViewerLauncher.launch(photo);
  }
}
