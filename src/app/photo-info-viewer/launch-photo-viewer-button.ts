import { Analytics } from '../../../src-shared/analytics/analytics';
import { Photo } from '../shared/model/photo.model';
import { IconDataUrl } from '../../assets/icon-data-url';
import { PhotoViewerLauncher } from '../photo-viewer-launcher/photo-viewer-launcher';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';

export class LaunchPhotoViewerButton {
  public static create(photo: Photo): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'photo-info-viewer-button';
    button.onclick = () => this.handleButtonClick(photo);

    const icon = document.createElement('img');
    icon.className = 'photo-info-viewer-icon';
    icon.src = IconDataUrl.launchExternalApp;

    const tooltip = document.createElement('span');
    tooltip.className = 'photo-info-viewer-button-tooltip';
    tooltip.innerText = `Open File`;

    button.appendChild(icon);
    button.appendChild(tooltip);
    return button;
  }

  private static handleButtonClick(photo: Photo): void {
    logger.info(`Clicked the launch photo viewer button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Launch Photo Viewer Button');
    PhotoViewerLauncher.launch(photo);
  }
}
