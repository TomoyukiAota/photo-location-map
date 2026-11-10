import { Photo } from '../../shared/model/photo.model';
import { removeFocus } from '../../shared/remove-focus';
import { getMoreOptionsMenuItems } from './more-options-menu-items';

const sidebarAreaId = '#home-left-sidebar';
const mapAreaId = '#home-map';

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

  /**
   * Moves the menu, once it is in the page, to the right when its left edge is beyond that of its area, the sidebar
   * or the map, which would cut it off.
   * TL;DR: The menu is as wide as its longest item, which depends on the language.
   * Details: Under the button, it opens leftwards from the button's right side. In English it was 24 px short of the
   * map's left edge for a popup at that edge; in Japanese, whose items are about 25 px wider, it was cut off there.
   */
  public static keepWithinArea(menuElement: HTMLElement, moreOptionsButton: HTMLElement): void {
    const area = moreOptionsButton.closest(sidebarAreaId) ?? document.querySelector(mapAreaId);
    if (!area || menuElement.style.right === '')
      return;

    const margin = 4;
    const cutOff = area.getBoundingClientRect().left + margin - menuElement.getBoundingClientRect().left;
    if (cutOff > 0)
      menuElement.style.right = `${parseFloat(menuElement.style.right) - cutOff}px`;
  }

  private static configureMenuPosition(menuElement: HTMLElement, moreOptionsButton: HTMLElement) {

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
