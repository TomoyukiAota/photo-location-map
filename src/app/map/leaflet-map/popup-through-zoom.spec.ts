// Leaflet and Leaflet.markercluster, which angular.json's scripts give the application: imported, Leaflet makes the
// global L itself, and Leaflet.markercluster adds its classes to it.
import 'leaflet';
import 'leaflet.markercluster';
import { keepPopupThroughZoom, PopupClosedByDoubleClick } from './popup-through-zoom';

// The global L that the imports make, as leaflet-map.component.ts declares it.
declare let L: any;

describe('keepPopupThroughZoom', () => {
  const containers: HTMLElement[] = [];

  /**
   * A map of 800 × 600 pixels, the size that jsdom, which lays nothing out, does not give it, up to zoom level 19, as
   * the map's base layers go: Leaflet.markercluster makes the clusters of each level up to the last one.
   */
  function mapAt(center: [number, number], zoom: number) {
    const container = document.body.appendChild(document.createElement('div'));
    Object.defineProperties(container, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    containers.push(container);
    return L.map(container, { maxZoom: 19 }).setView(center, zoom);
  }

  /** The group of a single photo's marker, and the group of several photos, as LeafletMapComponent makes them. */
  const groupOfSinglePhoto = () => L.markerClusterGroup({ animate: false });
  const groupOfPhotos = () => L.markerClusterGroup({
    animate: true, maxClusterRadius: 120, spiderfyOnMaxZoom: false, zoomToBoundsOnClick: false,
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    for (const container of containers.splice(0))
      container.remove();
  });

  /** Zooms the map, which jsdom does without an animation, and lets Leaflet.markercluster end its own. */
  function zoom(map: any, level: number): void {
    map.setZoom(level);
    vi.runAllTimers();
  }

  it('is needed, as Leaflet closes the popup of a marker that a zoom takes off the map', () => {
    const map = mapAt([34.69, 135.53], 13);
    const marker = L.marker([34.69, 135.53]).bindPopup('IMG_4676.JPG');
    map.addLayer(groupOfSinglePhoto().addLayer(marker));
    marker.openPopup();

    zoom(map, 14);

    expect(map.hasLayer(marker)).toBe(true);
    expect(marker.isPopupOpen()).toBe(false);
  });

  it('keeps the popup open while Leaflet.markercluster takes the marker off the map and puts it back at each zoom', () => {
    const map = mapAt([34.69, 135.53], 13);
    const marker = L.marker([34.69, 135.53]).bindPopup('IMG_4676.JPG');
    keepPopupThroughZoom(marker);
    map.addLayer(groupOfSinglePhoto().addLayer(marker));
    marker.openPopup();
    const takenOff = vi.fn();
    marker.on('remove', takenOff);

    zoom(map, 14);
    zoom(map, 12);

    expect(takenOff).toHaveBeenCalledTimes(2);
    expect(map.hasLayer(marker)).toBe(true);
    expect(marker.isPopupOpen()).toBe(true);
  });

  it('keeps the popup open where its photo is while a zoom puts the marker into a cluster, and the marker comes back under it', () => {
    // Two photos 3 km apart: 191 pixels at zoom level 13, 96 at 12, within the radius of a cluster.
    const map = mapAt([34.6873, 135.5426], 13);
    const west = L.marker([34.6873, 135.5262]);
    const east = L.marker([34.6873, 135.559]).bindPopup('east.JPG');
    keepPopupThroughZoom(east);
    map.addLayer(groupOfPhotos().addLayers([west, east]));
    east.openPopup();
    const popup = east.getPopup();
    const moved = vi.spyOn(popup, 'setLatLng');

    zoom(map, 12);
    expect(map.hasLayer(east)).toBe(false);
    expect(map.hasLayer(popup)).toBe(true);
    expect(popup.getLatLng()).toEqual(L.latLng(34.6873, 135.559));

    zoom(map, 13);
    expect(map.hasLayer(east)).toBe(true);
    expect(east.isPopupOpen()).toBe(true);
    expect(popup.getLatLng()).toEqual(L.latLng(34.6873, 135.559));
    // Not even for the moment that the marker is at the cluster's place, which Leaflet would pan the map to show.
    expect(moved).not.toHaveBeenCalled();
  });

  it('leaves the popup to close by itself, at a click on the map or for another popup', () => {
    const map = mapAt([34.6873, 135.5426], 13);
    const west = L.marker([34.6873, 135.5262]).bindPopup('west.JPG');
    const east = L.marker([34.6873, 135.559]).bindPopup('east.JPG');
    keepPopupThroughZoom(west);
    keepPopupThroughZoom(east);
    map.addLayer(groupOfPhotos().addLayers([west, east]));

    east.openPopup();
    west.openPopup();
    expect(east.isPopupOpen()).toBe(false);
    expect(west.isPopupOpen()).toBe(true);
    map.fire('preclick');
    expect(west.isPopupOpen()).toBe(false);
  });
});

describe('PopupClosedByDoubleClick', () => {
  it('gives the popup that the first click of a double-click closed, once', () => {
    const closed = new PopupClosedByDoubleClick<string>();

    closed.clicked('the popup', 1);
    closed.clicked(null, 2);

    expect(closed.doubleClicked()).toBe('the popup');
    expect(closed.doubleClicked()).toBeNull();
  });

  it('gives none for a double-click after a click alone that closed the popup', () => {
    const closed = new PopupClosedByDoubleClick<string>();

    closed.clicked('the popup', 1);
    closed.clicked(null, 1);
    closed.clicked(null, 2);

    expect(closed.doubleClicked()).toBeNull();
  });

  it('gives the popup that the second click closed, when the first one opened it, as on a marker', () => {
    const closed = new PopupClosedByDoubleClick<string>();

    closed.clicked('the popup before', 1);
    closed.clicked('the marker\'s popup', 2);

    expect(closed.doubleClicked()).toBe('the marker\'s popup');
  });

  it('takes a click that a script dispatched, whose count is 0, as a click alone', () => {
    const closed = new PopupClosedByDoubleClick<string>();

    closed.clicked('the popup', 1);
    closed.clicked(null, 0);

    expect(closed.doubleClicked()).toBeNull();
  });

  it('gives none once it has forgotten the popup, which the map took off with its markers', () => {
    const closed = new PopupClosedByDoubleClick<string>();

    closed.clicked('the popup', 1);
    closed.forget();
    closed.clicked(null, 2);

    expect(closed.doubleClicked()).toBeNull();
  });
});
