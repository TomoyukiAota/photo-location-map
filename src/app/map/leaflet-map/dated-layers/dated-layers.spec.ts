// Leaflet, which angular.json's scripts give the application as the global L: imported, it makes that global itself.
import 'leaflet';
import { TestBed } from '@angular/core/testing';
import { LeafletContentService } from '../leaflet-content.service';
import { DatedLayers } from './dated-layers';
import { MapDateService } from './map-date.service';

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
});
