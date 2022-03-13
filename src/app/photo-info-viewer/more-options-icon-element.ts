import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';

export class MoreOptionsIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src = IconDataUrl.moreOptions;
    element.width = 25;
    element.height = 25;
    element.className = 'photo-info-viewer-button';
    element.onmouseenter = (event: MouseEvent) => this.handleOnMouseEnter(event, photo);
    element.onmouseleave = (event: MouseEvent) => this.handleOnMouseLeave(event, photo);
    return element;
  }

  private static handleOnMouseEnter(event: MouseEvent, photo: Photo) {
    console.log(`${photo.name} handleOnMouseEnter, MouseEvent: `, event);
  }

  private static handleOnMouseLeave(event: MouseEvent, photo: Photo) {
    console.log(`${photo.name} handleOnMouseLeave, MouseEvent: `, event);
  }
}
