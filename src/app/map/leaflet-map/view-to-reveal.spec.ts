import type { LatLng } from 'leaflet';
import { ClusteredMarker, MarkerClusterLevel, viewToReveal } from './view-to-reveal';

const maxZoom = 19;

/** A place, as Leaflet gives it; without Leaflet, which the map loads as a script of the page. */
const latLng = (lat: number, lng: number) => ({ lat, lng }) as LatLng;

/**
 * The clusters of a marker as Leaflet.markercluster keeps them, from the top one down: for each, the zoom level that
 * the map shows it at and how many markers it has. The top one, below the map's least zoom, is first.
 */
function clusters(...levels: [zoom: number, childCount: number][]): MarkerClusterLevel {
  let parent: MarkerClusterLevel | undefined;
  for (const [index, [zoom, childCount]] of levels.entries())
    parent = { _zoom: zoom, _childCount: childCount, __parent: parent, getLatLng: () => latLng(index, index) };
  return parent;
}

function marker(deepestCluster?: MarkerClusterLevel): ClusteredMarker {
  return { __parent: deepestCluster, getLatLng: () => latLng(34.68, 135.19) };
}

describe('viewToReveal', () => {
  it('shows a marker that no other marker is near at any zoom level, at the marker', () => {
    const view = viewToReveal(marker(clusters([-1, 5])), maxZoom);

    expect(view).toEqual({ center: latLng(34.68, 135.19), zoom: 0 });
  });

  it('shows a marker from the zoom level after the last one at which it is in a cluster', () => {
    const view = viewToReveal(marker(clusters([-1, 5], [11, 3], [12, 2], [13, 2], [14, 2], [15, 2])), maxZoom);

    expect(view).toEqual({ center: latLng(34.68, 135.19), zoom: 16 });
  });

  it('shows the cluster of a photo taken at the place of others from the level at which it has those photos alone', () => {
    // Two photos at one place, with a third near them up to zoom level 11. The cluster of the two is shown from 12 on.
    const levels: [number, number][] = [[-1, 5], [11, 3]];
    for (let zoom = 12; zoom <= maxZoom; zoom++)
      levels.push([zoom, 2]);

    const view = viewToReveal(marker(clusters(...levels)), maxZoom);

    // At the cluster of the last zoom level, the deepest one.
    expect(view).toEqual({ center: latLng(levels.length - 1, levels.length - 1), zoom: 12 });
  });

  it('shows the cluster of photos all taken at one place at any zoom level', () => {
    const levels: [number, number][] = [[-1, 3]];
    for (let zoom = 0; zoom <= maxZoom; zoom++)
      levels.push([zoom, 3]);

    expect(viewToReveal(marker(clusters(...levels)), maxZoom).zoom).toBe(-1);
  });

  it('keeps the zoom level for a marker that is in no cluster group', () => {
    expect(viewToReveal(marker(), maxZoom)).toEqual({ center: latLng(34.68, 135.19), zoom: -Infinity });
  });
});
