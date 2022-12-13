import { Analytics } from '../../../src-shared/analytics/analytics';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';

export class RotateButton {
  public static create(thumbnailElement: HTMLImageElement, photo: Photo): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'photo-info-viewer-button';
    button.onclick = () => this.handleButtonClick(thumbnailElement, photo);
    button.title = 'Rotate the thumbnail 90 degrees';

    const icon = document.createElement('img');
    icon.className = 'photo-info-viewer-icon';
    icon.src = IconDataUrl.rotate;

    button.appendChild(icon);
    return button;
  }

  private static handleButtonClick(thumbnailElement: HTMLImageElement, photo: Photo): void {
    logger.info(`Clicked the rotate button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Rotate Button');
    this.rotateThumbnail(thumbnailElement);
  }

  private static rotateThumbnail(thumbnailElement: HTMLImageElement): void {
    const transformString = thumbnailElement.style.transform;
    if (transformString.includes('rotate(')) {
      const currentDegreeInString = transformString.split('rotate(')[1].split('deg)')[0];
      const currentDegree = Number(currentDegreeInString);
      const nextDegree = currentDegree + 90;
      thumbnailElement.style.transform = `rotate(${nextDegree}deg)`;
    } else {
      thumbnailElement.style.transform = 'rotate(90deg)';
    }
  }
}
