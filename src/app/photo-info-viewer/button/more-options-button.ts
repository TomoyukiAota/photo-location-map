import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { removeFocus } from "../../shared/remove-focus";
import { MoreOptionsMenuElement } from '../more-options-menu/more-options-menu-element';
import { createPhotoInfoViewerButton } from "./photo-info-viewer-button-util";

export class MoreOptionsButton {
  public static create(photo: Photo): HTMLElement {
    const onClick = () => this.handleButtonClick(photo, button);
    const button = createPhotoInfoViewerButton(onClick, IconDataUrl.moreOptions, 'More Options');
    button.classList.add('photo-info-viewer-more-options-button');
    return button;
  }

  private static fadeInCssClass = 'photo-info-viewer-more-options-menu-fade-in';
  private static fadeOutCssClass = 'photo-info-viewer-more-options-menu-fade-out';

  private static handleButtonClick(photo: Photo, button: HTMLElement) {
    const found = this.removeMoreOptionsMenuElementIfFound();
    if (found) {
      removeFocus(); // To restore the button's style
      return;
    }

    const element = MoreOptionsMenuElement.create(photo, button);
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
