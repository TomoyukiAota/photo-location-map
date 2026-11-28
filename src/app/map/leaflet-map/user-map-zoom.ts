import type { LeafletEvent, Map as LeafletMap } from 'leaflet';

declare let L: typeof import('leaflet');

/**
 * Reports zoom increases made with the map's own navigation. Leaflet's zoom events also run for setView and fitBounds,
 * and carry no input event. The wheel handler is debounced, and an animated zoom starts on the next frame.
 */
export function observeUserZoomIn(map: LeafletMap, onZoomIn: () => void) {
  const container = map.getContainer();
  const listeners = new AbortController();
  const capture = { capture: true, signal: listeners.signal };
  let inputExpiresAt = -1;
  let beforeZoom = map.getZoom();
  let byUser = false;

  function noteInput(): void {
    if (map.getZoom() < map.getMaxZoom())
      inputExpiresAt = performance.now() + (map.options.wheelDebounceTime ?? 40) + 200;
  }

  container.addEventListener('click', event => {
    if (event.isTrusted && event.target instanceof Element && event.target.closest('.leaflet-control-zoom-in[aria-disabled="false"]'))
      noteInput();
  }, capture);
  container.addEventListener('dblclick', event => {
    if (event.isTrusted && event.target instanceof Element && !event.shiftKey && map.doubleClickZoom.enabled()
      && !event.target.closest('.leaflet-marker-icon, .leaflet-popup, .leaflet-control'))
      noteInput();
  }, capture);
  container.addEventListener('keydown', event => {
    if (event.isTrusted && event.target === container && map.keyboard.enabled()
      && !event.altKey && !event.ctrlKey && !event.metaKey && (event.key === '=' || event.key === '+'))
      noteInput();
  }, capture);
  // Registered after Leaflet's handler. It cancels the wheel event only when it receives it, including Ctrl+wheel
  // from a trackpad pinch. A wheel over a scrollable popup does not reach that handler.
  container.addEventListener('wheel', event => {
    if (event.isTrusted && event.defaultPrevented && map.scrollWheelZoom.enabled() && L.DomEvent.getWheelDelta(event) > 0)
      noteInput();
  }, { passive: true, signal: listeners.signal });
  // The box-zoom handler finishes its Shift+drag on the document, including when it ends outside the map.
  container.ownerDocument.addEventListener('mouseup', event => {
    const boxZoom = map.boxZoom as typeof map.boxZoom & { moved(): boolean };
    if (event.isTrusted && event.button === 0 && boxZoom.enabled() && boxZoom.moved())
      noteInput();
  }, capture);

  map.on('zoomstart', () => {
    beforeZoom = map.getZoom();
    byUser = performance.now() <= inputExpiresAt;
    inputExpiresAt = -1;
  });
  map.on('zoom', (event: LeafletEvent & { pinch?: boolean }) => {
    if (event.pinch)
      byUser = true;
  });
  map.on('zoomend', () => {
    const zoomedInByUser = byUser && map.getZoom() > beforeZoom;
    byUser = false;
    inputExpiresAt = -1;
    if (zoomedInByUser)
      onZoomIn();
  });

  return {
    cancel: () => {
      inputExpiresAt = -1;
      byUser = false;
    },
    disconnect: () => listeners.abort(),
  };
}
