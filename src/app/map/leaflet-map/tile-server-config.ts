import { parse as parseJsonc } from 'jsonc-parser';

// The latest content of main branch in photo-location-map-resources repo is used.
const configFileUrl
  = 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-config/osm-tile-server-config-version-1.jsonc';

interface RasterTileProviderDefinition {
  name: string;
  url: string;
  attribution: string;
}

interface TileServerConfig {
  rasterTileProvidersInUse: string[];
  rasterTileProvidersDefinition: RasterTileProviderDefinition[];
}

async function fetchTileServerConfig(): Promise<TileServerConfig> {
  const response = await fetch(configFileUrl);
  const jsonc = await response.text();
  const json = parseJsonc(jsonc);
  return json as TileServerConfig;
}

export const tileServerConfig = await fetchTileServerConfig();

console.log('tileServerConfig:', tileServerConfig);
