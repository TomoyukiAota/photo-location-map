import { WritableSignal } from '@angular/core';
import { LeafletContentService } from '../leaflet-content.service';
import { GeomanToggleButtonComponent } from './geoman-toggle-button.component';

// Leaflet and its plugins are the global L of angular.json's scripts.
declare let L: any;

/** Adds the disclosure for the horizontal Geoman toolbar, after Geoman adds its own control. */
export function addGeomanToggleControl(map: any, contents: LeafletContentService, expansion: WritableSignal<boolean>): void {
  const button = contents.create(GeomanToggleButtonComponent, { expansion }).location.nativeElement;
  const Control = L.Control.extend({
    onAdd: () => {
      const bar = L.DomUtil.create('div', 'leaflet-bar plm-leaflet-map-geoman-toggle');
      L.DomEvent.disableClickPropagation(bar);
      L.DomEvent.disableScrollPropagation(bar);
      bar.appendChild(button);
      return bar;
    },
  });
  new Control({ position: 'bottomright' }).addTo(map);
}
