// Leaflet and Leaflet.markercluster, which angular.json's scripts give the application: imported, Leaflet makes the
// global L itself, and Leaflet.markercluster adds its classes to it.
import 'leaflet';
import 'leaflet.markercluster';
import { PhotosOfOpenPopup } from './photos-of-open-popup';
import { keepPopupThroughZoom } from './popup-through-zoom';

// The global L that the imports make, as leaflet-map.component.ts declares it.
declare let L: any;

describe('PhotosOfOpenPopup', () => {
  const containers: HTMLElement[] = [];
  let map: any;
  // The group of the photos, as LeafletMapComponent makes it for several photos.
  let photosGroup: any;
  let photosOfOpenPopup: PhotosOfOpenPopup;
  // Three photos in Osaka: west and east 3 km apart, 96 pixels at zoom level 12, within the radius of a cluster, and
  // 191 at 13; north 10 km from them, 80 pixels at zoom level 10, and 159 at 11.
  let west: any;
  let east: any;
  let north: any;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // 800 × 600 pixels, the size that jsdom, which lays nothing out, does not give it, up to zoom level 19, as the
    // map's base layers go: Leaflet.markercluster makes the clusters of each level up to the last one.
    const container = document.body.appendChild(document.createElement('div'));
    Object.defineProperties(container, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    containers.push(container);
    map = L.map(container, { maxZoom: 19 }).setView([34.72, 135.5426], 13);
    photosOfOpenPopup = new PhotosOfOpenPopup(map);
    west = L.marker([34.6873, 135.5262]).bindPopup('west.JPG');
    east = L.marker([34.6873, 135.559]).bindPopup('east.JPG');
    north = L.marker([34.7773, 135.5426]).bindPopup('north.JPG');
    for (const marker of [west, east, north])
      keepPopupThroughZoom(marker);
    photosGroup = L.markerClusterGroup({
      animate: true, maxClusterRadius: 120, spiderfyOnMaxZoom: false, zoomToBoundsOnClick: false,
    }).addLayers([west, east, north]);
    map.addLayer(photosGroup);
  });
  afterEach(() => {
    vi.useRealTimers();
    for (const container of containers.splice(0))
      container.remove();
  });

  /** Zooms the map, which jsdom does without an animation, and lets Leaflet.markercluster end its own. */
  function zoom(level: number): void {
    map.setZoom(level);
    vi.runAllTimers();
  }

  /** The clusters on the map, each as the markers in it. */
  function clusters(): any[][] {
    const shown: any[][] = [];
    map.eachLayer(layer => {
      if (layer instanceof L.MarkerCluster)
        shown.push(layer.getAllChildMarkers());
    });
    return shown;
  }

  /** The cluster on the map that has these markers, and only them. */
  function clusterOf(...markers: any[]): any {
    let found = null;
    map.eachLayer(layer => {
      if (layer instanceof L.MarkerCluster && layer.getChildCount() === markers.length
        && markers.every(marker => layer.getAllChildMarkers().includes(marker)))
        found = layer;
    });
    return found;
  }

  it('keeps the marker of the popup open out of the clusters at every zoom, and gives it back to them once the popup closes', async () => {
    east.openPopup();
    photosOfOpenPopup.take([east], photosGroup);
    expect(photosGroup.hasLayer(east)).toBe(false);
    expect(east.isPopupOpen()).toBe(true);
    expect(photosOfOpenPopup.shows(east)).toBe(true);

    // At zoom level 12, west is alone, rather than in a cluster with east; at 10, with north.
    zoom(12);
    expect(map.hasLayer(east)).toBe(true);
    expect(map.hasLayer(west)).toBe(true);
    expect(clusters()).toEqual([]);
    zoom(10);
    expect(map.hasLayer(east)).toBe(true);
    expect(clusterOf(west, north)).not.toBeNull();
    expect(east.isPopupOpen()).toBe(true);

    // Closed, the popup gives the marker back once the click that closed it, if one did, has been handled.
    east.closePopup();
    photosOfOpenPopup.giveBack();
    expect(photosOfOpenPopup.shows(east)).toBe(false);
    expect(photosGroup.hasLayer(east)).toBe(false);
    await Promise.resolve();
    expect(photosGroup.hasLayer(east)).toBe(true);
    expect(clusterOf(west, east, north)).not.toBeNull();
    expect(map.hasLayer(east)).toBe(false);
  });

  it('keeps the markers of a cluster\'s popup one cluster where they are at every zoom, apart from the clusters of the other photos', async () => {
    zoom(12);
    const centroid = clusterOf(west, east).getLatLng();
    photosOfOpenPopup.take([west, east], photosGroup);

    // At zoom levels 13 and 19, they would be two markers; at 10, in a cluster with north, which is alone there.
    for (const level of [12, 13, 19, 10]) {
      map.setView(centroid, level);
      vi.runAllTimers();
      expect(clusterOf(west, east)?.getLatLng().equals(centroid, 1e-9)).toBe(true);
      expect(clusters().length).toBe(1);
    }
    expect(map.hasLayer(north)).toBe(true);

    photosOfOpenPopup.giveBack();
    await Promise.resolve();
    expect(clusterOf(west, east, north)).not.toBeNull();
    zoom(13);
    expect([west, east, north].every(marker => map.hasLayer(marker))).toBe(true);
  });

  it('gives back the markers of the popup that closed before it takes those of the popup that opens, and keeps these', async () => {
    photosOfOpenPopup.take([east], photosGroup);

    photosOfOpenPopup.giveBack();
    photosOfOpenPopup.take([west], photosGroup);
    await Promise.resolve();

    expect(photosGroup.hasLayer(east)).toBe(true);
    expect(photosGroup.hasLayer(west)).toBe(false);
    expect(photosOfOpenPopup.shows(west)).toBe(true);
  });

  it('gives the markers back at once, when asked, as before a click on a cluster is handled, and not while the popup is open', () => {
    photosOfOpenPopup.take([east], photosGroup);

    photosOfOpenPopup.giveBackNow();
    expect(photosGroup.hasLayer(east)).toBe(false);
    photosOfOpenPopup.giveBack();
    photosOfOpenPopup.giveBackNow();
    expect(photosGroup.hasLayer(east)).toBe(true);
  });

  it('draws them on a pane of their own, above the markers and clusters', async () => {
    photosOfOpenPopup.take([east], photosGroup);
    expect(east.getElement().parentElement.classList).toContain('plm-leaflet-map-photos-of-open-popup-pane');

    photosOfOpenPopup.giveBack();
    await Promise.resolve();
    expect(east.getElement().parentElement).toBe(map.getPane('markerPane'));
  });

  it('gives the focus back to the marker that had it, whose element Leaflet makes again', async () => {
    east.getElement().focus();

    photosOfOpenPopup.take([east], photosGroup);
    expect(document.activeElement).toBe(east.getElement());

    photosOfOpenPopup.giveBack();
    await Promise.resolve();
    expect(document.activeElement).toBe(east.getElement());
  });

  it('forgets the markers, which the map takes off with their group', async () => {
    photosOfOpenPopup.take([east], photosGroup);

    photosOfOpenPopup.giveBack();
    photosOfOpenPopup.forget();
    await Promise.resolve();

    expect(map.hasLayer(east)).toBe(false);
    expect(photosGroup.hasLayer(east)).toBe(false);
  });
});
