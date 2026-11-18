const sidebarAreaSelector = '#home-left-sidebar';
const mapAreaSelector = '#home-map';

/**
 * Where the menu is, from the edges of its button. The sides are named by the direction of the text
 * (inset-inline-*), so that they are the other way round in a language written from right to left: "end" is the
 * right side, or the left side there.
 */
export interface MoreOptionsMenuPlacement {
  readonly top: string | null;
  readonly bottom: string | null;
  readonly insetInlineStart: string | null;
  /** In pixels, as keepMenuWithinArea() changes it. */
  readonly insetInlineEnd: number | null;
}

/** What the placement of the menu is decided by. */
export interface RoomAroundButton {
  /** Whether the button is in the sidebar, where the menu opens at the button's own side; otherwise on the map. */
  readonly isWithinSidebar: boolean;
  /** From the button's bottom edge to the bottom of its area, the sidebar or the map. */
  readonly below: number;
  /** From the button to the edge of the window, on the side that the texts run to. */
  readonly beside: number;
}

/** The menu's size as it is laid out in the page, in pixels. */
export interface MoreOptionsMenuSize {
  readonly width: number;
  readonly height: number;
}

/**
 * What the menu needs besides its own size where it opens: the 1 px between it and its button, which is 36 px high and
 * wide while the menu is 37 px from the button's edge, and its shadow.
 */
const roomBesidesMenu = 20;

/**
 * Where the menu opens: below its button where it fits, otherwise beside the button on the map where it fits on the
 * side that the texts run to, otherwise above the button.
 * TL;DR: The menu fits where the room is larger than the menu, which is measured once it is in the page.
 * Details: The menu is as high as its items, of which a photo without a location has fewer, and as wide as its longest
 * item, which depends on the language. Until it is measured, `menuSize` is null and the menu is below its button:
 * MoreOptionsMenuComponent measures it there and places it again before it is painted.
 */
export function placeMenu(room: RoomAroundButton, menuSize: MoreOptionsMenuSize | null): MoreOptionsMenuPlacement {
  const insetInlineEnd = room.isWithinSidebar ? 0 : -25;
  const fitsBelow = !menuSize || room.below > menuSize.height + roomBesidesMenu;
  const fitsBeside = !room.isWithinSidebar && !!menuSize && room.beside > menuSize.width + roomBesidesMenu;

  if (fitsBelow)
    return { top: '37px', bottom: null, insetInlineStart: null, insetInlineEnd };
  if (fitsBeside)
    return { top: null, bottom: '0', insetInlineStart: '37px', insetInlineEnd: null };
  return { top: null, bottom: '37px', insetInlineStart: null, insetInlineEnd };
}

/** The room around a button of the page, for placeMenu(). */
export function roomAround(moreOptionsButton: HTMLElement): RoomAroundButton {
  const isWithinSidebar = !!moreOptionsButton.closest(sidebarAreaSelector);
  const { clientWidth: viewportWidth, clientHeight: viewportHeight } = document.documentElement;
  // The window stands in for an area that is not in the page, as in a test of the viewer alone.
  const areaHeight = document.querySelector(isWithinSidebar ? sidebarAreaSelector : mapAreaSelector)?.clientHeight ?? viewportHeight;
  const { bottom: buttonBottom, left: buttonLeft, right: buttonRight } = moreOptionsButton.getBoundingClientRect();
  return {
    isWithinSidebar,
    below: areaHeight - buttonBottom,
    // The side that the texts run to: the right, or the left in a language written from right to left.
    beside: isRightToLeft(moreOptionsButton) ? buttonLeft : viewportWidth - buttonRight,
  };
}

/**
 * How far the menu, once it is in the page, is beyond the edge of its area, the sidebar or the map, which would cut it
 * off; 0 when it is within the area. The menu is moved by as much towards the inside.
 * TL;DR: The menu is as wide as its longest item, which depends on the language.
 * Details: Under the button, it opens leftwards from the button's right side. In English it was 24 px short of the
 * map's left edge for a popup at that edge; in Japanese, whose items are about 25 px wider, it was cut off there.
 * In a language written from right to left, the sides are the other way round: the menu opens rightwards from the
 * button's left side, and is moved to the left when its right edge is beyond that of its area.
 */
export function cutOffAtEdgeOfArea(menu: HTMLElement, moreOptionsButton: HTMLElement): number {
  const area = moreOptionsButton.closest(sidebarAreaSelector) ?? document.querySelector(mapAreaSelector);
  if (!area)
    return 0;

  const margin = 4;
  const areaBounds = area.getBoundingClientRect();
  const menuBounds = menu.getBoundingClientRect();
  const cutOff = isRightToLeft(moreOptionsButton)
    ? menuBounds.right - (areaBounds.right - margin)
    : areaBounds.left + margin - menuBounds.left;
  return Math.max(0, cutOff);
}

/** Whether the button is in a page of a language written from right to left, where it is at the left of its row. */
function isRightToLeft(moreOptionsButton: HTMLElement): boolean {
  return getComputedStyle(moreOptionsButton).direction === 'rtl';
}
