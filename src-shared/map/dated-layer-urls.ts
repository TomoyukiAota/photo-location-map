// TL;DR: The addresses that the map's layers of a past date read: Esri World Imagery Wayback and OpenHistoricalMap
// (src/app/map/leaflet-map/dated-layers/). The main window's Content Security Policy lets the page, and the workers of
// MapLibre, which run under the same policy, connect to these and no other of their servers
// (src-main/file-server/content-security-policy.ts).
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

/** OpenHistoricalMap: vector tiles whose features have the dates when they came and went, in its style "Historic". */
export const openHistoricalMapUrls = {
  /** The style, which names the addresses below. */
  style: 'https://www.openhistoricalmap.org/map-styles/main/main.json',
  /** The style's folder: its sprites and its glyphs (fonts). */
  styleFolder: 'https://www.openhistoricalmap.org/map-styles/',
  /** The vector tiles of its data, of land and of water. */
  vectorTiles: 'https://vtiles.openhistoricalmap.org/maps/',
  /** The raster tiles of land cover and terrain under the data. */
  rasterTiles: 'https://static-tiles.openhistoricalmap.org/',
} as const;
