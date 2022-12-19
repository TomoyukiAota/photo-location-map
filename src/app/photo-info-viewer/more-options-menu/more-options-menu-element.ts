import { Photo } from '../../shared/model/photo.model';
import { removeFocus } from "../../shared/remove-focus";
import { getMoreOptionsMenuItems } from './more-options-menu-items';

export class MoreOptionsMenuElement {
  public static create(photo: Photo, moreOptionsButton: HTMLElement): HTMLElement {
    const menuElement = document.createElement('div');
    menuElement.className = 'photo-info-viewer-more-options-menu';
    this.configureMenuPosition(menuElement, moreOptionsButton);

    const menuItems = getMoreOptionsMenuItems(photo);
    menuItems.forEach(item => {
      const menuItemElement = this.createMenuItemElement(item.text, item.onClick);
      menuElement.appendChild(menuItemElement);
    });

    return menuElement;
  }

  private static configureMenuPosition(menuElement: HTMLElement, moreOptionsButton: HTMLElement) {
    menuElement.style.right = '-25px';

    const viewportHeightWithoutScrollbar = document.documentElement.clientHeight;
    const buttonTop = moreOptionsButton.getBoundingClientRect().top;
    const valueToDetermineMenuPosition = 260; // Adjust this value if the menu height changes.
    const shouldShowMenuBelowButton = viewportHeightWithoutScrollbar - buttonTop > valueToDetermineMenuPosition;

    if (shouldShowMenuBelowButton) {
      menuElement.style.top = '39px';
    } else {
      menuElement.style.bottom = '37px';
    }
  }

  private static createMenuItemElement(text: string, onClick: (event: MouseEvent) => void): HTMLElement {
    const element = document.createElement('div');
    element.className = 'photo-info-viewer-more-options-menu-item';
    element.innerText = text;
    element.onclick = (event: MouseEvent) => {
      event.stopPropagation();
      onClick(event);
      removeFocus(); // 1) Trigger focusout event to close MoreOptionsMenuElement, and 2) remove the focus style of MoreOptionsButton.
    };
    return element;
  }
}
