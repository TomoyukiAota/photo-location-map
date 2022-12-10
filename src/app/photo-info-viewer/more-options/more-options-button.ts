import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { MoreOptionsMenuElement } from './more-options-menu-element';

export class MoreOptionsButton {
  public static create(photo: Photo): HTMLElement {
    const button = document.createElement('button');
    button.className = 'photo-info-viewer-more-options-button';
    button.onclick = (event: MouseEvent) => this.handleButtonClick(event, photo, button);
    button.title = 'More Options';

    const icon = document.createElement('img');
    icon.className = 'photo-info-viewer-icon';
    icon.src = IconDataUrl.moreOptions;

    button.appendChild(icon);
    return button;
  }

  private static fadeInCssClass = 'photo-info-viewer-more-options-menu-fade-in';
  private static fadeOutCssClass = 'photo-info-viewer-more-options-menu-fade-out';

  private static handleButtonClick(event: MouseEvent, photo: Photo, button: HTMLElement) {
    const found = this.removeMoreOptionsMenuElementIfFound();
    if (found) {
      setTimeout(() => {
        (document.activeElement as HTMLElement)?.blur?.(); // Remove the style for focus
      });
      return;
    }

    const element = MoreOptionsMenuElement.create(photo, event);
    element.classList.add(this.fadeInCssClass);
    button.appendChild(element);
    button.addEventListener(
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
