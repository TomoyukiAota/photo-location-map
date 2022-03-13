import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { MoreOptionsMenuElement } from './more-options-menu-element';

export class MoreOptionsIconElement {
  public static create(photo: Photo): HTMLElement {
    const wrapperElement = document.createElement('div');
    wrapperElement.className = 'photo-info-viewer-more-options-icon-wrapper';

    const imgElement = document.createElement('img');
    imgElement.src = IconDataUrl.moreOptions;
    imgElement.width = 25;
    imgElement.height = 25;
    imgElement.className = 'photo-info-viewer-more-options-icon';
    imgElement.onmouseenter = (event: MouseEvent) => this.handleOnMouseEnter(event, photo, wrapperElement);
    imgElement.onmouseleave = (event: MouseEvent) => this.handleOnMouseLeave(event, photo, wrapperElement);

    wrapperElement.appendChild(imgElement);
    return wrapperElement;
  }

  private static moreOptionsMenuElementId = 'more-options-menu-element-id';

  private static handleOnMouseEnter(event: MouseEvent, photo: Photo, parentElement: HTMLElement) {
    console.log(`${photo.name} handleOnMouseEnter, MouseEvent: `, event);
    const element = MoreOptionsMenuElement.create(photo);
    element.id = this.moreOptionsMenuElementId;
    parentElement.appendChild(element);
  }

  private static handleOnMouseLeave(event: MouseEvent, photo: Photo, parentElement: HTMLElement) {
    console.log(`${photo.name} handleOnMouseLeave, MouseEvent: `, event);
    const element = document.getElementById(this.moreOptionsMenuElementId);
    // element.remove();
  }
}
