import { parse as parseJsonc } from 'jsonc-parser';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { toLoggableString } from '../../../../src-shared/log/to-loggable-string';
import { leafletMapLogger as logger } from './leaflet-map-logger';

// Represents the content of raster-tile-base-layer-configs-version-1.jsonc in photo-location-map-resources repo.
interface RasterTileBaseLayerConfigsVersion1 {
  version: string;
  rasterTileBaseLayerConfigs: RasterTileBaseLayerConfigs[];
}

interface RasterTileBaseLayerConfigs {
  name: string;
  url: string;
  options?: any;
}

// The fallback configs used in case of failing to fetch the configs from photo-location-map-resources repo.
export const rasterTileBaseLayerConfigsVersion1Fallback: RasterTileBaseLayerConfigsVersion1 = {
  version: '1',
  rasterTileBaseLayerConfigs: [
    {
      name: 'OpenStreetMap',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '© OpenStreetMap contributors'
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

// In the production environment, the content of main branch in photo-location-map-resources repo is used.
// In the development environment, the content of the feature branch can be used as needed.
const configsFileUrl
  = 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-configs/raster-tile-base-layer-configs-version-1.jsonc';

async function fetchRasterTileBaseLayerConfigsVersion1(): Promise<RasterTileBaseLayerConfigsVersion1> {
  const response = await fetch(configsFileUrl);
  if (!response.ok) {
    throw new Error(`response.status: ${response.status}, response.statusText: ${response.statusText}`);
  }
  const jsonc = await response.text();
  const json = parseJsonc(jsonc);
  return json as RasterTileBaseLayerConfigsVersion1;
}

function recordErrorAndGetFallback(message: string): RasterTileBaseLayerConfigsVersion1 {
  logger.error(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fallback BaseLayerConfigs`, message);
  return rasterTileBaseLayerConfigsVersion1Fallback;
}

async function fetchRasterTileBaseLayerConfigsVersion1WithFallback(): Promise<RasterTileBaseLayerConfigsVersion1> {
  const fetchingMessage = `Fetching ${configsFileUrl}`;
  logger.info(fetchingMessage);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fetching BaseLayerConfigs`, fetchingMessage);

  let configs: RasterTileBaseLayerConfigsVersion1;
  try {
    configs = await fetchRasterTileBaseLayerConfigsVersion1();
  } catch (error) {
    const message = `Failed to fetch ${configsFileUrl}. Using the fallback configs. ${error.message}`;
    return recordErrorAndGetFallback(message);
  }

  if (!configs?.rasterTileBaseLayerConfigs?.length) {
    const message = `Invalid configs object is fetched from ${configsFileUrl}. Using the fallback configs.\n${toLoggableString(configs)}`;
    return recordErrorAndGetFallback(message);
  }

  const fetchedMessage = `Fetched ${configsFileUrl}\n${toLoggableString(configs)}`;
  logger.info(fetchedMessage);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fetched BaseLayerConfigs`, fetchedMessage);
  return configs;
}

export const rasterTileBaseLayerConfigsVersion1 = await fetchRasterTileBaseLayerConfigsVersion1WithFallback();
