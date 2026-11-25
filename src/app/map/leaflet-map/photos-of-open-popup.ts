import type { Map as LeafletMap, Marker } from 'leaflet';

// The global L that angular.json's scripts give the application, with Leaflet.markercluster's classes.
declare let L: any;

/** The pane of the photos that the popup open shows: above the other markers and clusters (_plm-leaflet-map.scss). */
const paneOfPhotosOfOpenPopup = 'plmPhotosOfOpenPopupPane';

/**
 * The photos that the popup open shows, kept on the map as the popup shows them, under it, at every zoom: the marker
 * of a photo, or the photos of a cluster together, out of the map's clusters and drawn above them, until the popup
 * closes.
 * TL;DR: A popup that stayed open through a zoom out pointed at nothing, once its marker had gone into a cluster.
 * Details:
 * - A photo whose popup is open keeps its marker, with its label colored as chosen, at every zoom, rather than going
 *   into a cluster nearby, whose number then counts the other photos.
 * - The photos of a cluster's popup stay one cluster, where the popup points, at every zoom: a zoom in does not split
 *   them, nor does a zoom out put them into a larger cluster. Their group clusters whatever is within the width of the
 *   world at each zoom level.
 * - They are on a pane of their own, above the markers and clusters near them.
 * - Once the popup closes, they go back into the map's clusters, as the zoom makes them. They go back after the click
 *   that closed the popup, if one did, has been handled: going back changes the clusters near them, whose elements
 *   Leaflet.markercluster makes again, and a click on such a cluster would then reach no cluster.
 */
export class PhotosOfOpenPopup {
  private readonly group: any;
  // The markers that the popup open shows, and the group of the map that they came from.
  private markers: Marker[] = [];
  private from: any = null;
  // Whether the popup has closed, so that the markers are to go back to their group.
  private closed = false;

  public constructor(map: LeafletMap) {
    L.DomUtil.addClass(map.createPane(paneOfPhotosOfOpenPopup), 'plm-leaflet-map-photos-of-open-popup-pane');
    this.group = L.markerClusterGroup({
      animate: false,
      maxClusterRadius: (zoom: number) => 256 * 2 ** zoom,
      spiderfyOnMaxZoom: false,
      zoomToBoundsOnClick: false,
      clusterPane: paneOfPhotosOfOpenPopup,
    }).addTo(map);
  }

  /**
   * Takes the markers of the popup that opens out of `from`, the map's group of markers, once those of the popup
   * before have gone back to their group.
   */
  public take(markers: readonly Marker[], from: any): void {
    this.giveBackNow();
    if (!markers.length || !from)
      return;
    keepingFocus(markers, () => {
      removeFromGroup(from, markers);
      for (const marker of markers)
        marker.options.pane = paneOfPhotosOfOpenPopup;
      this.group.addLayers(markers);
    });
    this.markers = [...markers];
    this.from = from;
  }

  /** The popup has closed: its markers go back to their group, after the click that closed it, if one did. */
  public giveBack(): void {
    if (!this.markers.length || this.closed)
      return;
    this.closed = true;
    queueMicrotask(() => this.giveBackNow());
  }

  /** Gives the markers of the popup that has closed back to their group now, if they have not gone back yet. */
  public giveBackNow(): void {
    if (!this.closed)
      return;
    const { markers, from } = this;
    this.markers = [];
    this.from = null;
    this.closed = false;
    keepingFocus(markers, () => {
      removeFromGroup(this.group, markers);
      for (const marker of markers)
        marker.options.pane = 'markerPane';
      from.addLayers(markers);
    });
  }

  /** Whether the popup open shows the marker. */
  public shows(marker: Marker): boolean {
    return !this.closed && this.markers.includes(marker);
  }

  /** Forgets the markers, which the map takes off with their group, as it shows other photos. */
  public forget(): void {
    this.group.clearLayers();
    this.markers = [];
    this.from = null;
    this.closed = false;
  }
}

/**
 * Takes the markers out of a group of Leaflet.markercluster.
 * TL;DR: Its removeLayers(), unlike its removeLayer() and clearLayers(), leaves the group's listeners on the markers.
 * Details: The group listens to the moves of its markers, and takes a marker that moves out of its clusters and puts
 * it back (_childMarkerMoved() in MarkerClusterGroup.js). The group of the photos moves the markers that come out of a
 * cluster for its animation of a zoom in: with the listeners of the group that the markers had left, those markers
 * went back into that group, as the unit test of a cluster's popup saw.
 */
function removeFromGroup(group: any, markers: readonly Marker[]): void {
  group.removeLayers(markers);
  for (const marker of markers)
    marker.off(group._childMarkerEventHandlers, group);
}

/**
 * Moves the markers from one group to the other, which makes the element of each again, and gives the focus back to
 * the element of the marker that had it, as Enter on a marker opens its popup.
 */
function keepingFocus(markers: readonly Marker[], move: () => void): void {
  const focused = markers.find(marker => marker.getElement() && marker.getElement() === document.activeElement);
  move();
  focused?.getElement()?.focus({ preventScroll: true });
}
