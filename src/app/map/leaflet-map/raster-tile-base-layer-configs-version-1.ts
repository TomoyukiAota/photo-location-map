/* eslint-disable max-len */ // For rasterTileBaseLayerConfigsVersion1Fallback

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
      name: 'Esri World Topo Map',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
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
const configsFileFetchArguments: Array<{ url: string, options: RequestInit }> = [
  {
    url: 'https://cdn.jsdelivr.net/gh/TomoyukiAota/photo-location-map-resources@main/map-configs/raster-tile-base-layer-configs-version-1.jsonc',
    options: {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000 /* milliseconds */),
    },
  },
  {
    url: 'https://raw.githubusercontent.com/TomoyukiAota/photo-location-map-resources/refs/heads/main/map-configs/raster-tile-base-layer-configs-version-1.jsonc',
    options: {
      cache: 'no-store',
      // No timeout for the last attempt.
    },
  },
];

async function fetchRasterTileBaseLayerConfigsVersion1(url: string, options: RequestInit): Promise<{configs: RasterTileBaseLayerConfigsVersion1, responseText: string}> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`response.status: ${response.status}, response.statusText: ${response.statusText}`);
  }
  const responseText = await response.text();
  const configs = parseJsonc(responseText) as RasterTileBaseLayerConfigsVersion1;
  return {configs, responseText};
}

function recordFetchingConfigs(url: string): void {
  const message = `Fetching ${url}`;
  logger.info(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fetching BaseLayerConfigs`, message);
}

function recordInvalidConfigsObjectError(url: string, configs: any, responseText: string): void {
  const message = `Invalid configs object is fetched from ${url}.\n----------\nconfigs:\n${toLoggableString(configs)}\n----------\nresponseText:\n${responseText}`;
  logger.error(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Invalid BaseLayerConfigs`, message);
}

function recordFetchSuccess(url: string, configs: RasterTileBaseLayerConfigsVersion1, responseText: string): void {
  const message = `Fetched ${url}\n----------\nconfigs:\n${toLoggableString(configs)}\n----------\nresponseText:\n${responseText}`;
  logger.info(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fetched BaseLayerConfigs`, message);
}

function recordFetchFailed(url: string, error: Error): void {
  const message = `Failed to fetch ${url}. error.message: "${error.message}"`;
  logger.error(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Failed to fetch configs`, message);
}

function recordFetchFailedForAllUrls(): void {
  const message = `Failed to fetch the configs from all the possible URLs. Using the fallback configs.`;
  logger.error(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fallback BaseLayerConfigs`, message);
}

async function fetchRasterTileBaseLayerConfigsVersion1WithRetry(): Promise<RasterTileBaseLayerConfigsVersion1> {
  for (const {url, options} of configsFileFetchArguments) {
    try {
      recordFetchingConfigs(url);
      const {configs, responseText} = await fetchRasterTileBaseLayerConfigsVersion1(url, options);
      if (!configs?.rasterTileBaseLayerConfigs?.length) {
        recordInvalidConfigsObjectError(url, configs, responseText);
        continue;
      }
      recordFetchSuccess(url, configs, responseText);
      return configs;
    } catch (error) {
      recordFetchFailed(url, error);
    }
  }

  recordFetchFailedForAllUrls();
  return rasterTileBaseLayerConfigsVersion1Fallback;
}

export const rasterTileBaseLayerConfigsVersion1 = await fetchRasterTileBaseLayerConfigsVersion1WithRetry();
