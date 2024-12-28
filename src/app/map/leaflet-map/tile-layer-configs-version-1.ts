import { parse as parseJsonc } from 'jsonc-parser';
import { toLoggableString } from '../../../../src-shared/log/to-loggable-string';
import { leafletMapLogger as logger } from './leaflet-map-logger';

// The latest content of main branch in photo-location-map-resources repo is used.
const configFileUrl
  = 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-configs/tile-layer-configs-version-1.jsonc';

interface TileLayerConfigs {
  name: string;
  url: string;
  options?: any;
}

interface TileLayerConfigsVersion1 {
  version: string;
  tileLayerConfigs: TileLayerConfigs[];
}

export const tileLayerConfigsVersion1Fallback: TileLayerConfigsVersion1 = {
  version: '1',
  tileLayerConfigs: [
    {
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }
    },
    {
      name: 'Esri World Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    }
  ],
};

async function fetchTileLayerConfigsVersion1(): Promise<TileLayerConfigsVersion1> {
  const response = await fetch(configFileUrl);
  const jsonc = await response.text();
  const json = parseJsonc(jsonc);
  return json as TileLayerConfigsVersion1;
}

async function fetchTileLayerConfigsVersion1WithFallback(): Promise<TileLayerConfigsVersion1> {
  try {
    const configs = await fetchTileLayerConfigsVersion1();
    if (!configs?.tileLayerConfigs?.length) {
      logger.error('Failed to fetch the tile layer configs. The configs object is invalid. Using the fallback configs.');
      return tileLayerConfigsVersion1Fallback;
    }
    return configs;
  } catch (error) {
    logger.error('Failed to fetch the tile layer configs with some error. Using the fallback configs.', error);
    return tileLayerConfigsVersion1Fallback;
  }
}

logger.info(`Fetching tileLayerConfigsVersion1 from ${configFileUrl}`);

export const tileLayerConfigsVersion1 = await fetchTileLayerConfigsVersion1WithFallback();

logger.info(`Fetched tileLayerConfigsVersion1:\n${toLoggableString(tileLayerConfigsVersion1)}`);
