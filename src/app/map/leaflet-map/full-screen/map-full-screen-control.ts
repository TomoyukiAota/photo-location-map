import { LeafletContentService } from '../leaflet-content.service';
import { MapFullScreenButtonComponent } from './map-full-screen-button.component';

// Leaflet and its plugins are the global L of angular.json's scripts.
declare let L: any;

/**
 * Adds the button of the map's full screen right above the zoom buttons, in a bar of its own: a bar of one button, as
 * Leaflet's zoom buttons are in theirs. Its component goes with the map (LeafletContentService).
 * TL;DR: Call it after the zoom buttons are added, and before Leaflet-Geoman's toolbar.
 * Details:
 * - Leaflet puts a control that is added to a bottom corner above those added there before it: the scale, then the
 *   zoom buttons, then this, then Leaflet-Geoman's toolbar, from the bottom up.
 * - A bar of its own rather than a button in the zoom buttons' bar: zooming in and out step the map's zoom, one
 *   operation of two buttons, while full screen is another (docs/tasks/20261125_map-full-screen/STATUS.md).
 * - In a short map, the full-screen bar and zoom buttons move together beside Geoman's toolbar
 *   (src/styles/plm-leaflet-map/_plm-leaflet-map-controls.scss).
 */
export function addMapFullScreenControl(map: any, contents: LeafletContentService): void {
  const button: HTMLElement = contents.create(MapFullScreenButtonComponent, {}).location.nativeElement;
  const Control = L.Control.extend({
    onAdd: () => {
      const bar = L.DomUtil.create('div', 'leaflet-bar plm-leaflet-map-full-screen');
      // A click on the button is not one on the map, which would close the popup that is open.
      L.DomEvent.disableClickPropagation(bar);
      L.DomEvent.disableScrollPropagation(bar);
      bar.appendChild(button);
      return bar;
    },
  });
  new Control({ position: 'bottomright' }).addTo(map);
}
