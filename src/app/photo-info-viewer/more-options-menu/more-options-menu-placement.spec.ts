import { cutOffAtEdgeOfArea, placeMenu, roomAround } from './more-options-menu-placement';

describe('placeMenu', () => {
  it('opens the menu below its button where there is room, from the button\'s side in the sidebar', () => {
    expect(placeMenu({ isWithinSidebar: true, below: 196, beside: 0 }))
      .toEqual({ top: '37px', bottom: null, insetInlineStart: null, insetInlineEnd: 0 });
  });

  it('opens the menu below its button on the map a little beyond the button\'s side', () => {
    expect(placeMenu({ isWithinSidebar: false, below: 500, beside: 500 }))
      .toEqual({ top: '37px', bottom: null, insetInlineStart: null, insetInlineEnd: -25 });
  });

  it('opens the menu beside its button on the map where there is no room below but room beside', () => {
    expect(placeMenu({ isWithinSidebar: false, below: 195, beside: 231 }))
      .toEqual({ top: null, bottom: '0', insetInlineStart: '37px', insetInlineEnd: null });
  });

  it('opens the menu above its button where there is room neither below nor beside', () => {
    expect(placeMenu({ isWithinSidebar: false, below: 195, beside: 230 }))
      .toEqual({ top: null, bottom: '37px', insetInlineStart: null, insetInlineEnd: -25 });
  });

  it('never opens the menu beside its button in the sidebar, which is narrow', () => {
    expect(placeMenu({ isWithinSidebar: true, below: 0, beside: 1000 }))
      .toEqual({ top: null, bottom: '37px', insetInlineStart: null, insetInlineEnd: 0 });
  });
});

describe('the menu in the page', () => {
  /** An element at these bounds, which a test page without a layout would not give it. */
  function elementAt(bounds: Partial<DOMRect>, parent: HTMLElement = document.body, id = ''): HTMLElement {
    const element = document.createElement('div');
    element.id = id;
    element.getBoundingClientRect = () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, ...bounds }) as DOMRect;
    parent.appendChild(element);
    return element;
  }

  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.dir = '';
  });

  it('measures the room below a button of the sidebar within the sidebar', () => {
    const sidebar = elementAt({}, document.body, 'home-left-sidebar');
    Object.defineProperty(sidebar, 'clientHeight', { value: 700 });
    const button = elementAt({ left: 240, right: 276, bottom: 400 }, sidebar);

    expect(roomAround(button)).toMatchObject({ isWithinSidebar: true, below: 300 });
  });

  it('measures the room below a button of a popup within the map, and the room beside it to the edge of the window', () => {
    const map = elementAt({}, document.body, 'home-map');
    Object.defineProperty(map, 'clientHeight', { value: 500 });
    const button = elementAt({ left: 300, right: 336, bottom: 450 }, map);
    const viewportWidth = document.documentElement.clientWidth;

    expect(roomAround(button)).toEqual({ isWithinSidebar: false, below: 50, beside: viewportWidth - 336 });
    // The texts run to the left in a language written from right to left.
    document.documentElement.dir = 'rtl';
    expect(roomAround(button)).toEqual({ isWithinSidebar: false, below: 50, beside: 300 });
  });

  it('says how far the menu is beyond the left edge of its area, less a margin', () => {
    const map = elementAt({ left: 300, right: 1200 }, document.body, 'home-map');
    const button = elementAt({}, map);

    expect(cutOffAtEdgeOfArea(elementAt({ left: 280, right: 466 }, button), button)).toBe(24);
    expect(cutOffAtEdgeOfArea(elementAt({ left: 304, right: 490 }, button), button)).toBe(0);
    expect(cutOffAtEdgeOfArea(elementAt({ left: 500, right: 686 }, button), button)).toBe(0);
  });

  it('says how far the menu is beyond the right edge of its area in a language written from right to left', () => {
    document.documentElement.dir = 'rtl';
    const sidebar = elementAt({ left: 900, right: 1200 }, document.body, 'home-left-sidebar');
    const button = elementAt({}, sidebar);

    expect(cutOffAtEdgeOfArea(elementAt({ left: 1040, right: 1210 }, button), button)).toBe(14);
    expect(cutOffAtEdgeOfArea(elementAt({ left: 1000, right: 1170 }, button), button)).toBe(0);
  });
});
