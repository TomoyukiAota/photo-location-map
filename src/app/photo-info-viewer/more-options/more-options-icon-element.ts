import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { MoreOptionsMenuElement } from './more-options-menu-element';

export class MoreOptionsIconElement {
  public static create(photo: Photo): HTMLElement {
    const containerElement = document.createElement('button');
    containerElement.className = 'photo-info-viewer-more-options-icon-container';
    containerElement.onclick = (event: MouseEvent) => this.handleOnClick(event, photo, containerElement);

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

  private static handleOnClick(event: MouseEvent, photo: Photo, containerElement: HTMLElement) {
    const found = this.removeMoreOptionsMenuElementIfFound();
    if (found) return;

    const element = MoreOptionsMenuElement.create(photo, event);
    element.classList.add(this.fadeInCssClass);
    containerElement.appendChild(element);
    containerElement.addEventListener(
      'focusout',
      () => this.removeMoreOptionsMenuElementIfFound(),
      { once: true }
    );
  }

  private static removeMoreOptionsMenuElementIfFound() {
    const elements = Array.from(document.getElementsByClassName(this.fadeInCssClass));
    const found = elements.length >= 1;
    elements.forEach(element => {
      element.classList.remove(this.fadeInCssClass);
      element.classList.add(this.fadeOutCssClass);
      setTimeout(() => element.remove(), 500);
    });
    return found;
  }
}
