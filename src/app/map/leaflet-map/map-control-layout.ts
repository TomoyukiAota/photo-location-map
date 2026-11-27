export interface MapControlLayout {
  placement: 'single-column' | 'two-columns' | 'beside-scale' | 'above-scale';
  regionInfoBottom?: number;
  navigationRight?: number;
}

// Keep the same clearance as Leaflet's gap between the controls at the bottom right.
const layerButtonClearance = 10;
const toolbarSideGap = 10;

function verticalMargins(style: CSSStyleDeclaration): number {
  return parseFloat(style.marginTop) + parseFloat(style.marginBottom);
}

function outerHeight(element: HTMLElement): number {
  return element.getBoundingClientRect().height + verticalMargins(getComputedStyle(element));
}

/**
 * Measures the space needed by the controls in each vertical layout independently of their current positions. Opening
 * the layers list or one of Geoman's actions should not move the buttons under the pointer.
 */
export function observeMapControlLayout(map: HTMLElement, setLayout: (layout: MapControlLayout) => void): ResizeObserver {
  const layersButton = map.querySelector<HTMLElement>('.leaflet-control-layers-toggle');
  const corner = map.querySelector<HTMLElement>('.leaflet-bottom.leaflet-right');
  const toolbar = corner.querySelector<HTMLElement>('.leaflet-pm-toolbar');
  const tools = Array.from(toolbar.querySelectorAll<HTMLElement>(':scope > .button-container'));
  const fullScreen = corner.querySelector<HTMLElement>('.plm-leaflet-map-full-screen');
  const zoom = corner.querySelector<HTMLElement>('.leaflet-control-zoom');
  const scale = corner.querySelector<HTMLElement>('.leaflet-control-scale');
  const attribution = corner.querySelector<HTMLElement>('.leaflet-control-attribution');

  let layersBottom = 0;
  let layersLeftInset = 0;
  const update = () => {
    const mapBox = map.getBoundingClientRect();
    const layersBox = layersButton.getBoundingClientRect();
    if (layersBox.height > 0) {
      layersBottom = layersBox.bottom - mapBox.top;
      layersLeftInset = mapBox.right - layersBox.left;
    }

    // The toolbar's frame and the individual buttons have the same height in a row as in a column.
    const toolbarStyle = getComputedStyle(toolbar);
    const toolbarFrameHeight = parseFloat(toolbarStyle.borderTopWidth) + parseFloat(toolbarStyle.borderBottomWidth)
      + parseFloat(toolbarStyle.paddingTop) + parseFloat(toolbarStyle.paddingBottom);
    const toolHeights = tools.map(outerHeight);
    const toolbarMargins = verticalMargins(toolbarStyle);
    const toolbarInColumn = toolHeights.reduce((sum, height) => sum + height, 0) + toolbarFrameHeight + toolbarMargins;
    const navigation = outerHeight(fullScreen) + outerHeight(zoom);
    const attributionHeight = outerHeight(attribution);
    const scaleHeight = outerHeight(scale);
    const available = mapBox.height - layersBottom - layerButtonClearance - scaleHeight - attributionHeight;

    if (available >= toolbarInColumn + navigation) {
      setLayout({ placement: 'single-column' });
      return;
    }
    if (available >= Math.max(toolbarInColumn, navigation)) {
      setLayout({ placement: 'two-columns' });
      return;
    }

    const toolbarRowWidth = tools.reduce((width, tool) => width + tool.getBoundingClientRect().width, 0)
      + parseFloat(toolbarStyle.borderLeftWidth) + parseFloat(toolbarStyle.borderRightWidth)
      + parseFloat(toolbarStyle.paddingLeft) + parseFloat(toolbarStyle.paddingRight);
    const scaleWidth = scale.getBoundingClientRect().width + parseFloat(getComputedStyle(scale).marginRight);
    const besideScale = toolbarRowWidth + scaleWidth + 2 * toolbarSideGap <= mapBox.width;
    const toolbarRowHeight = Math.max(...toolHeights) + toolbarFrameHeight;
    // Leave the region information above the row, independently of the width of its translated text.
    const toolbarStackHeight = besideScale ? 0 : toolbarRowHeight + toolbarMargins;
    const belowToolbar = besideScale ? parseFloat(getComputedStyle(scale).marginBottom) : scaleHeight + toolbarMargins;
    setLayout({
      placement: besideScale ? 'beside-scale' : 'above-scale',
      regionInfoBottom: attributionHeight + belowToolbar + toolbarRowHeight + toolbarSideGap,
      // The navigation can use the space at the left of the layers button in a very short map.
      navigationRight: available < navigation + toolbarStackHeight ? layersLeftInset + layerButtonClearance : undefined,
    });
  };

  const observer = new ResizeObserver(update);
  for (const element of [map, layersButton, toolbar, ...tools, fullScreen, zoom, scale, attribution])
    observer.observe(element, { box: 'border-box' });
  update();
  return observer;
}
