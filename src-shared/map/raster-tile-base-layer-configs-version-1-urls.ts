// The addresses of raster-tile-base-layer-configs-version-1.jsonc in the photo-location-map-resources repository,
// which the renderer downloads, in this order, as the list of the map's base layers
// (src/app/map/leaflet-map/raster-tile-base-layer-configs-version-1.ts). The main window's Content Security Policy lets
// the page fetch these addresses and no other of their servers (src-main/file-server/content-security-policy.ts).
// In the production environment, the content of main branch in photo-location-map-resources repo is used.
// In the development environment, the content of the feature branch can be used as needed.

export const rasterTileBaseLayerConfigsVersion1Urls = {
  gitHub: 'https://raw.githubusercontent.com/TomoyukiAota/photo-location-map-resources/refs/heads/main/map-configs/raster-tile-base-layer-configs-version-1.jsonc',
  jsDelivr: 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-configs/raster-tile-base-layer-configs-version-1.jsonc',
} as const;
