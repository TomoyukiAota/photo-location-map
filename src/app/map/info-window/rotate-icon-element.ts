import { IconDataUrl } from '../../../assets/icon-data-url';

export class RotateIconElement {
  public static create(thumbnailElement: HTMLImageElement): HTMLImageElement {
    const rotateIconElement = document.createElement('img');
    rotateIconElement.src     = IconDataUrl.rotate;
    rotateIconElement.width = 25;
    rotateIconElement.height = 25;
    rotateIconElement.title = 'Rotate the thumbnail 90 degrees';
    rotateIconElement.className = 'info-window-icon';
    rotateIconElement.onclick = () => this.rotateThumbnail(thumbnailElement);
    return rotateIconElement;
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
