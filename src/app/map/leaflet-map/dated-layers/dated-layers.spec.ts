// Leaflet, which angular.json's scripts give the application as the global L: imported, it makes that global itself.
import 'leaflet';
import { TestBed } from '@angular/core/testing';
import { LeafletContentService } from '../leaflet-content.service';
import { DatedLayers, openHistoricalMapLayerName } from './dated-layers';
import { MapDateService } from './map-date.service';

// The global L that the import of Leaflet makes, as dated-layers.ts declares it.
declare let L: any;

describe('DatedLayers', () => {
  /** The names of the layers that DatedLayers offers for the map's list of base layers, while `hidden` are hidden. */
  function offered(...hidden: string[]): string[] {
    const map = { on: () => undefined };
    const layers = new DatedLayers(map, TestBed.inject(MapDateService), TestBed.inject(LeafletContentService), () => [],
      { maxZoom: 19 }, new Set(hidden));
    return Object.keys(layers.baseLayers);
  }

  it('offers the layers that the list of base layers does not hide, which it names as the map\'s list of layers does', () => {
    // The names written out, as photo-location-map-resources writes them in hiddenBuiltInBaseLayers: a layer that is
    // renamed keeps its old name as its identifier (waybackLayerName in dated-layers.ts).
    const wayback = 'Esri World Imagery Wayback';
    const openHistoricalMap = 'OpenHistoricalMap';

    expect(offered()).toEqual([wayback, openHistoricalMap]);
    expect(offered(wayback)).toEqual([openHistoricalMap]);
    expect(offered(openHistoricalMap, 'OpenStreetMap')).toEqual([wayback]);
    expect(offered(wayback, openHistoricalMap)).toEqual([]);
  });

  it('puts its control in a corner of its own, not in the top right one below the layers button, which the map removes', () => {
    // Where the corner is on the map is its styles' (_plm-leaflet-map-date.scss), which the e2e suite checks.
    const container = document.body.appendChild(document.createElement('div'));
    const map = L.map(container, { center: [34.6493, 135.385], zoom: 16 });
    const contents = TestBed.inject(LeafletContentService);
    const layers = new DatedLayers(map, TestBed.inject(MapDateService), contents, () => [], { maxZoom: 19 }, new Set());
    const corners = () => [...container.querySelectorAll('.plm-leaflet-map-date-corner')];
    const control = () => container.querySelector('.plm-leaflet-map-date');

    layers.baseLayerChanged(layers.baseLayers[openHistoricalMapLayerName]);
    expect(corners()).toHaveLength(1);
    expect(corners()[0].className).toBe('leaflet-top leaflet-right plm-leaflet-map-date-corner');
    expect(corners()[0].parentElement).toBe(container.querySelector('.leaflet-control-container'));
    expect(control().parentElement).toBe(corners()[0]);

    // Another layer, then the same one again: the box goes, and comes back to the same corner.
    layers.baseLayerChanged(null);
    expect(control()).toBeNull();
    layers.baseLayerChanged(layers.baseLayers[openHistoricalMapLayerName]);
    expect(corners()).toHaveLength(1);
    expect(control().parentElement).toBe(corners()[0]);

    // As LeafletMapComponent removes the map.
    layers.destroy();
    map.remove();
    contents.destroyAll();
    expect(corners()).toEqual([]);
    container.remove();
  });
});
