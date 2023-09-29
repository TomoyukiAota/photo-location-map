import { Photo } from '../../shared/model/photo.model';
import { removeFocus } from '../../shared/remove-focus';
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
    const sidebarAreaId = '#home-left-sidebar';
    const mapAreaId = '#home-map';

    const isWithinSidebar = !!moreOptionsButton.closest(sidebarAreaId);
    const {clientHeight: areaHeight} = isWithinSidebar
      ? document.querySelector(sidebarAreaId)
      : document.querySelector(mapAreaId);
    const {clientWidth: viewportWidth} = document.documentElement;
    const {bottom: buttonBottom, right: buttonRight} = moreOptionsButton.getBoundingClientRect();

    const enoughRoomBelowButton = areaHeight - buttonBottom > 195; // Adjust the value if the menu height changes.
    const enoughRoomRightToButton = isWithinSidebar
      ? false
      : viewportWidth - buttonRight > 230; // Adjust the value if the menu width changes.

    if (enoughRoomBelowButton) {
      menuElement.style.top = '37px';
      menuElement.style.right = isWithinSidebar ? '0' : '-25px';
    } else if (enoughRoomRightToButton) {
      menuElement.style.bottom = '0';
      menuElement.style.left = '37px';
    } else {
      menuElement.style.bottom = '37px';
      menuElement.style.right = isWithinSidebar ? '0' : '-25px';
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
