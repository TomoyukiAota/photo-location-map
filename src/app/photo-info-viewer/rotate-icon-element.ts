import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';

export class RotateIconElement {
  public static create(thumbnailElement: HTMLImageElement, photo: Photo): HTMLImageElement {
    const rotateIconElement = document.createElement('img');
    rotateIconElement.src = IconDataUrl.rotate;
    rotateIconElement.width = 25;
    rotateIconElement.height = 25;
    rotateIconElement.title = 'Rotate the thumbnail 90 degrees';
    rotateIconElement.className = 'photo-info-viewer-button';
    rotateIconElement.onclick = () => this.handleRotateIconClick(thumbnailElement, photo);
    return rotateIconElement;
  }

  private static handleRotateIconClick(thumbnailElement: HTMLImageElement, photo: Photo): void {
    Logger.info(`Photo Info Viewer: Clicked the rotate icon for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Rotate Icon');
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
