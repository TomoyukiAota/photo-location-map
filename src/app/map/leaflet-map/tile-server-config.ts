import { parse as parseJsonc } from 'jsonc-parser';
import { toLoggableString } from '../../../../src-shared/log/to-loggable-string';
import { leafletMapLogger as logger } from './leaflet-map-logger';

// The latest content of main branch in photo-location-map-resources repo is used.
const configFileUrl
  = 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-config/osm-tile-server-config-version-1.jsonc';

interface RasterTileProviderDefinition {
  name: string;
  url: string;
  attribution: string;
}

interface TileServerConfig {
  version: string;
  rasterTileProvidersInUse: string[];
  rasterTileProvidersDefinition: RasterTileProviderDefinition[];
}

export const tileServerConfigFallback: TileServerConfig = {
  version: '1',
  rasterTileProvidersInUse: ['StandardTileLayer'],
  rasterTileProvidersDefinition: [
    {
      name: 'StandardTileLayer',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    }
  ],
};

async function fetchTileServerConfig(): Promise<TileServerConfig> {
  const response = await fetch(configFileUrl);
  const jsonc = await response.text();
  const json = parseJsonc(jsonc);
  return json as TileServerConfig;
}

async function fetchTileServerConfigWithFallback(): Promise<TileServerConfig> {
  try {
    const config = await fetchTileServerConfig();
    if (!config) {
      return tileServerConfigFallback;
    }
    return config;
  } catch (error) {
    logger.error('Failed to fetch tile server config. Using fallback config.', error);
    return tileServerConfigFallback;
  }
}

logger.info(`Fetching tileServerConfig from ${configFileUrl}`);

export const tileServerConfig = await fetchTileServerConfigWithFallback();

logger.info(`Fetched tileServerConfig:\n${toLoggableString(tileServerConfig)}`);
