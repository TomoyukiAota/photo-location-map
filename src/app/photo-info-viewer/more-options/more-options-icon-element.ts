import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { MoreOptionsMenuElement } from './more-options-menu-element';

export class MoreOptionsIconElement {
  public static create(photo: Photo): HTMLElement {
    const containerElement = document.createElement('div');
    containerElement.className = 'photo-info-viewer-more-options-icon-container';
    containerElement.onmouseenter = (event: MouseEvent) => this.handleOnMouseEnter(event, photo, containerElement);
    containerElement.onmouseleave = () => this.handleOnMouseLeave();

    const imgElement = document.createElement('img');
    imgElement.src = IconDataUrl.moreOptions;
    imgElement.width = 25;
    imgElement.height = 25;
    imgElement.className = 'photo-info-viewer-more-options-icon';

    containerElement.appendChild(imgElement);
    return containerElement;
  }

  private static fadeInCssClass = 'photo-info-viewer-more-options-menu-fade-in';
  private static fadeOutCssClass = 'photo-info-viewer-more-options-menu-fade-out';

  private static handleOnMouseEnter(event: MouseEvent, photo: Photo, wrapperElement: HTMLElement) {
    const element = MoreOptionsMenuElement.create(photo, event);
    element.classList.add(this.fadeInCssClass);
    wrapperElement.appendChild(element);
  }

  private static handleOnMouseLeave() {
    // All menu elements with the fade-in CSS class needs to be removed.
    // This is because quickly hovering in and out the more options icon
    // (i.e. the duration less than the delay to remove the elements)
    // makes multiple menu elements to exist at the same time.
    const elements = Array.from(document.getElementsByClassName(this.fadeInCssClass));
    elements.forEach(element => {
      element?.classList.remove(this.fadeInCssClass);
      element?.classList.add(this.fadeOutCssClass);
      setTimeout(() => element?.remove(), 600);
    });
  }
}
