import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { MoreOptionsMenuElement } from './more-options-menu-element';

export class MoreOptionsIconElement {
  public static create(photo: Photo): HTMLElement {
    const wrapperElement = document.createElement('div');
    wrapperElement.className = 'photo-info-viewer-more-options-icon-wrapper';
    wrapperElement.onmouseenter = (event: MouseEvent) => this.handleOnMouseEnter(event, photo, wrapperElement);
    wrapperElement.onmouseleave = () => this.handleOnMouseLeave();

    const imgElement = document.createElement('img');
    imgElement.src = IconDataUrl.moreOptions;
    imgElement.width = 25;
    imgElement.height = 25;
    imgElement.className = 'photo-info-viewer-more-options-icon';

    wrapperElement.appendChild(imgElement);
    return wrapperElement;
  }

  private static moreOptionsMenuElementId = 'more-options-menu-element-id';

  private static handleOnMouseEnter(event: MouseEvent, photo: Photo, wrapperElement: HTMLElement) {
    const element = MoreOptionsMenuElement.create(photo, event);
    element.id = this.moreOptionsMenuElementId;
    wrapperElement.appendChild(element);
  }

  private static handleOnMouseLeave() {
    const element = document.getElementById(this.moreOptionsMenuElementId);
    element.remove();
  }
}
