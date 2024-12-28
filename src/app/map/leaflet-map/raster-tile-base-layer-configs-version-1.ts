import { parse as parseJsonc } from 'jsonc-parser';
import { toLoggableString } from '../../../../src-shared/log/to-loggable-string';
import { leafletMapLogger as logger } from './leaflet-map-logger';

// In the production environment, the content of main branch in photo-location-map-resources repo is used.
// In the development environment, the content of the feature branch can be used as needed.
const configFileUrl
  = 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-configs/raster-tile-base-layer-configs-version-1.jsonc';

interface RasterTileBaseLayerConfigs {
  name: string;
  url: string;
  options?: any;
}

interface RasterTileBaseLayerConfigsVersion1 {
  version: string;
  rasterTileBaseLayerConfigs: RasterTileBaseLayerConfigs[];
}

export const rasterTileBaseLayerConfigsVersion1Fallback: RasterTileBaseLayerConfigsVersion1 = {
  version: '1',
  rasterTileBaseLayerConfigs: [
    {
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }
    },
    {
      name: 'Esri World Street Map',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
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

async function fetchRasterTileBaseLayerConfigsVersion1(): Promise<RasterTileBaseLayerConfigsVersion1> {
  const response = await fetch(configFileUrl);
  const jsonc = await response.text();
  const json = parseJsonc(jsonc);
  return json as RasterTileBaseLayerConfigsVersion1;
}

async function fetchRasterTileBaseLayerConfigsVersion1WithFallback(): Promise<RasterTileBaseLayerConfigsVersion1> {
  try {
    const configs = await fetchRasterTileBaseLayerConfigsVersion1();
    if (!configs?.rasterTileBaseLayerConfigs?.length) {
      logger.error('Failed to fetch RasterTileBaseLayerConfigsVersion1. The configs object is invalid. Using the fallback configs.');
      return rasterTileBaseLayerConfigsVersion1Fallback;
    }
    return configs;
  } catch (error) {
    logger.error('Failed to fetch RasterTileBaseLayerConfigsVersion1 with some error. Using the fallback configs.', error);
    return rasterTileBaseLayerConfigsVersion1Fallback;
  }
}

logger.info(`Fetching RasterTileBaseLayerConfigsVersion1 from ${configFileUrl}`);

export const rasterTileBaseLayerConfigsVersion1 = await fetchRasterTileBaseLayerConfigsVersion1WithFallback();

logger.info(`Fetched RasterTileBaseLayerConfigsVersion1:\n${toLoggableString(rasterTileBaseLayerConfigsVersion1)}`);
