import { LeafletContentService } from '../leaflet-content.service';
import { MapFullScreenButtonComponent } from './map-full-screen-button.component';

// Leaflet and its plugins are the global L of angular.json's scripts.
declare let L: any;

/**
 * Adds the button of the map's full screen to the map's top left, the corner that nothing else is in: a bar of one
 * button, as Leaflet's zoom buttons are in theirs. Its component goes with the map (LeafletContentService).
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
  new Control({ position: 'topleft' }).addTo(map);
}
