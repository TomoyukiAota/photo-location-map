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

/**
 * Where the menu opens: below its button where there is room, otherwise beside the button on the map where there is
 * room on the side that the texts run to, otherwise above the button.
 */
export function placeMenu(room: RoomAroundButton): MoreOptionsMenuPlacement {
  const insetInlineEnd = room.isWithinSidebar ? 0 : -25;
  const enoughRoomBelow = room.below > 195; // Adjust the value if the menu height changes.
  const enoughRoomBeside = !room.isWithinSidebar && room.beside > 230; // Adjust the value if the menu width changes.

  if (enoughRoomBelow)
    return { top: '37px', bottom: null, insetInlineStart: null, insetInlineEnd };
  if (enoughRoomBeside)
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
