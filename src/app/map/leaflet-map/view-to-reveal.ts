import type { LatLng } from 'leaflet';

/** What Leaflet.markercluster keeps of a cluster, as the deepest cluster of a marker or one above it. */
export interface MarkerClusterLevel {
  /** The zoom level at which the map shows the cluster. */
  readonly _zoom: number;
  /** How many markers are in the cluster, with those of the clusters in it. */
  readonly _childCount: number;
  /** The cluster that it is in, one zoom level lower; none for the top one, which the map never shows. */
  readonly __parent?: MarkerClusterLevel;
  getLatLng(): LatLng;
}

/** A marker of a Leaflet.markercluster group, which the group gives the deepest cluster that the marker is in. */
export interface ClusteredMarker {
  readonly __parent?: MarkerClusterLevel;
  getLatLng(): LatLng;
}

/** Where the map is moved to for a marker that it reveals, and the zoom level that it needs at least. */
export interface ViewToReveal {
  readonly center: LatLng;
  readonly zoom: number;
}

/**
 * Where the map shows a marker that it reveals, and from which zoom level: where the marker is on its own, so that its
 * popup opens on it; or, for a photo taken at the place of others, where its cluster has those photos alone, which
 * the map shows in the cluster's popup, as a click on the cluster does (LeafletMapComponent.handleClusterClick()).
 * TL;DR: Leaflet.markercluster keeps, for each marker, the deepest cluster that it is in (`__parent`), with the zoom
 * level that the map shows that cluster at (`_zoom`). From the next level on, the marker is on its own.
 * Details: A cluster is in a cluster one zoom level lower, up to the top one, whose level is below the map's least
 * zoom: that is the deepest cluster of a marker that is in no cluster at all. A marker whose deepest cluster is at the
 * map's last zoom level is never on its own; the clusters above that one have the same markers up to the level at
 * which another marker is near them, so the cluster that the map shows has those markers alone from the lowest of
 * those levels on.
 */
export function viewToReveal(marker: ClusteredMarker, maxZoom: number): ViewToReveal {
  const deepestCluster = marker.__parent;
  if (!deepestCluster)
    return { center: marker.getLatLng(), zoom: -Infinity };
  if (deepestCluster._zoom < maxZoom)
    return { center: marker.getLatLng(), zoom: deepestCluster._zoom + 1 };

  let highestClusterOfSameMarkers = deepestCluster;
  while (highestClusterOfSameMarkers.__parent?._childCount === deepestCluster._childCount)
    highestClusterOfSameMarkers = highestClusterOfSameMarkers.__parent;
  return { center: deepestCluster.getLatLng(), zoom: highestClusterOfSameMarkers._zoom };
}
