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
   * In a language written from right to left, the sides are the other way round: the menu opens rightwards from the
   * button's left side, and is moved to the left when its right edge is beyond that of its area.
   */
  public static keepWithinArea(menuElement: HTMLElement, moreOptionsButton: HTMLElement): void {
    const area = moreOptionsButton.closest(sidebarAreaId) ?? document.querySelector(mapAreaId);
    if (!area || menuElement.style.insetInlineEnd === '')
      return;

    const margin = 4;
    const areaBounds = area.getBoundingClientRect();
    const menuBounds = menuElement.getBoundingClientRect();
    const cutOff = this.isRightToLeft(moreOptionsButton)
      ? menuBounds.right - (areaBounds.right - margin)
      : areaBounds.left + margin - menuBounds.left;
    if (cutOff > 0)
      menuElement.style.insetInlineEnd = `${parseFloat(menuElement.style.insetInlineEnd) - cutOff}px`;
  }

  /** Whether the button is in a page of a language written from right to left, where it is at the left of its row. */
  private static isRightToLeft(moreOptionsButton: HTMLElement): boolean {
    return getComputedStyle(moreOptionsButton).direction === 'rtl';
  }

  private static configureMenuPosition(menuElement: HTMLElement, moreOptionsButton: HTMLElement) {

    const isWithinSidebar = !!moreOptionsButton.closest(sidebarAreaId);
    const {clientHeight: areaHeight} = isWithinSidebar
      ? document.querySelector(sidebarAreaId)
      : document.querySelector(mapAreaId);
    const {clientWidth: viewportWidth} = document.documentElement;
    const {bottom: buttonBottom, left: buttonLeft, right: buttonRight} = moreOptionsButton.getBoundingClientRect();

    const enoughRoomBelowButton = areaHeight - buttonBottom > 195; // Adjust the value if the menu height changes.
    // The room on the side that the texts run to: the right, or the left in a language written from right to left.
    const roomBesideButton = this.isRightToLeft(moreOptionsButton) ? buttonLeft : viewportWidth - buttonRight;
    const enoughRoomBesideButton = isWithinSidebar
      ? false
      : roomBesideButton > 230; // Adjust the value if the menu width changes.

    // The sides are named by the direction of the text (inset-inline-*), so that they are the other way round in a
    // language written from right to left: "end" is the right side, or the left side there.
    if (enoughRoomBelowButton) {
      menuElement.style.top = '37px';
      menuElement.style.insetInlineEnd = isWithinSidebar ? '0' : '-25px';
    } else if (enoughRoomBesideButton) {
      menuElement.style.bottom = '0';
      menuElement.style.insetInlineStart = '37px';
    } else {
      menuElement.style.bottom = '37px';
      menuElement.style.insetInlineEnd = isWithinSidebar ? '0' : '-25px';
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
