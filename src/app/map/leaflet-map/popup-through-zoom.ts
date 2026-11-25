import type { LeafletEventHandlerFn, Marker } from 'leaflet';

/**
 * Keeps a marker's popup open, and where it is, while Leaflet.markercluster takes the marker off the map or moves it,
 * as it does at a zoom.
 * TL;DR: Leaflet closes the popup of a marker that is taken off the map, so a zoom closed the popup of a photo.
 * Details:
 * - Leaflet closes a marker's popup when the marker is taken off the map, and moves the popup with the marker
 *   (bindPopup() in leaflet/src/layer/Popup.js).
 * - At a zoom, Leaflet.markercluster takes markers off the map, and puts back those that the map shows at the new zoom
 *   level: in a group that does not animate, every marker at every zoom, as the group of a single photo and that of
 *   what the popup open shows (PhotosOfOpenPopup) do; in the group of several photos, which does, a marker that goes
 *   into a cluster or far out of view. A marker that comes out of a cluster is moved to the cluster's place for the
 *   animation, and back at once.
 * - The map also takes the marker of a popup that opens off its group, into that of what the popup open shows, and puts
 *   it back once the popup closes. The markers do not leave the map otherwise: the map closes the popup that is open
 *   before it takes its markers off for other photos (LeafletMapComponent.removeMarkers()). Nor do they move, as a
 *   photo's place does not change.
 * - Moved with the marker, the popup would come back with it, but Leaflet pans the map to bring a popup that moves into
 *   view (DivOverlay.setLatLng()): the map would move by itself while the user zooms.
 */
export function keepPopupThroughZoom(marker: Marker): void {
  const { _movePopup } = marker as unknown as { _movePopup: LeafletEventHandlerFn };
  marker.off({ remove: marker.closePopup, move: _movePopup });
}

/**
 * The popup that the clicks of a double-click on the map closed, which the double-click, a zoom, opens again.
 * TL;DR: The first click of a double-click closes the popup that is open, as any click on the map does, before anyone
 * can tell that a second click follows.
 * Details: Leaflet closes the popup at the click (its event preclick, with the map's option closePopupOnClick), and
 * zooms the map at the double-click, which comes after the second click. The popup is gone for the moment between the
 * two clicks, and comes back as it was. Closing it only once no second click had come would make every click that
 * closes a popup wait for that time, which the operating system sets, and the page cannot know. A double-click on a
 * marker or a cluster does not zoom the map, as Leaflet keeps their clicks from the map.
 */
export class PopupClosedByDoubleClick<Popup> {
  private popup: Popup | null = null;

  /**
   * A click on the map, or on what is on it, before Leaflet closes the popup that is open then, if any: `clickCount`
   * is the click's UIEvent.detail, 1 for a click alone or the first of a double-click, and 2 for the second.
   */
  public clicked(openPopup: Popup | null, clickCount: number): void {
    this.popup = clickCount >= 2 ? openPopup ?? this.popup : openPopup;
  }

  /** A double-click on the map: the popup that its clicks closed, if any, to open again. */
  public doubleClicked(): Popup | null {
    const popup = this.popup;
    this.popup = null;
    return popup;
  }

  /** Forgets the popup, which the map has taken off with its markers. */
  public forget(): void {
    this.popup = null;
  }
}
