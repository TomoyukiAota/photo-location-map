// TL;DR: The addresses that the map's layer of a past date reads: Esri World Imagery Wayback
// (src/app/map/leaflet-map/dated-layers/). The main window's Content Security Policy lets the page connect to these
// and no other of its servers (src-main/file-server/content-security-policy.ts).
// Details: The tiles of Wayback are images, which img-src lets load from any server on https; the rest is fetched.

/**
 * Esri World Imagery Wayback: World Imagery as it was published in each of its releases, since February 2014. A
 * release covers the whole world; a tile in it is the imagery of the last release that changed that tile.
 */
export const waybackUrls = {
  /** The list of the releases, which Esri's own Wayback app and @esri/wayback-core read. */
  releases: 'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json',
  /** `{release}/{z}/{y}/{x}` after it: the release in which the tile last changed, as `select`. */
  tilemap: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tilemap/',
  /** The prefix of each release's metadata service, which tells when the imagery at a point was taken. */
  metadata: 'https://metadata.maptiles.arcgis.com/arcgis/rest/services/',
  /** The tiles of a release, as Leaflet's template: an image, which redirects to the release that has the tile. */
  tile: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/{release}/{z}/{y}/{x}',
} as const;
