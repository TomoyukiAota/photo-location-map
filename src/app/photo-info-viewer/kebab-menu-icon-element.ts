import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';

export class KebabMenuIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src = IconDataUrl.kebabMenu;
    element.width = 25;
    element.height = 25;
    element.title = `More Actions`;
    element.className = 'photo-info-viewer-button';
    return element;
  }
}
