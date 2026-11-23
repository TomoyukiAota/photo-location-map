/* eslint-disable @stylistic/max-len */ // For rasterTileBaseLayerConfigsVersion1Fallback

import { parse as parseJsonc } from 'jsonc-parser';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { toLoggableString } from '../../../../src-shared/log/to-loggable-string';
import { rasterTileBaseLayerConfigsVersion1Urls } from '../../../../src-shared/map/raster-tile-base-layer-configs-version-1-urls';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { leafletMapLogger as logger } from './leaflet-map-logger';

// Represents the content of raster-tile-base-layer-configs-version-1.jsonc in photo-location-map-resources repo.
interface RasterTileBaseLayerConfigsVersion1 {
  version: string;
  rasterTileBaseLayerConfigs: RasterTileBaseLayerConfigs[];
  /**
   * Optional: the base layers of the app's own that the app does not show, by their names
   * (hiddenBuiltInBaseLayersOf()).
   */
  hiddenBuiltInBaseLayers?: string[];
}

interface RasterTileBaseLayerConfigs {
  name: string;
  url: string;
  options?: any;
}

// The fallback configs, used when no address gives the configs of photo-location-map-resources repo in its time and no
// earlier launch has saved any (readSavedConfigs).
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

export interface ConfigsFileFetchAttempt {
  url: string;
  /** How long the attempt waits for the whole file, from when it starts. */
  timeoutMilliseconds: number;
}

// The addresses, and which branch of photo-location-map-resources they are of, are in src-shared, as the main window's
// Content Security Policy lets the page fetch them.
//
// TL;DR: Each address gets 10 seconds, the last one too. When neither gives configs in its time, the page starts after
// 20 seconds at most, with the configs that an earlier launch fetched and saved, or with the fallback configs when
// there are none. The page starts Angular only once it has configs (src/start-app.ts), and the last attempt had no
// time limit, so the page stayed at its loading text for as long as the network left that request unanswered.
// Details:
// - As the owner remembers it (2026-11-22), the last attempt had no limit so that the page would start with fetched
//   configs whenever it could. That was not written down: not in the commits, nor in pull request #579, which brought
//   it, nor in #585, which swapped the two addresses. The time limit came when jsDelivr was the only address (commit
//   "Set timeout to 10 seconds.", 2025-01-07). The same night raw.githubusercontent.com came after it, with the
//   comment "No timeout for the last attempt.". But what comes after the last attempt is reached only when it fails,
//   and a request that is not answered fails only when the network stack gives up on it.
// - The saved configs serve that aim without the wait: a launch whose fetches give nothing starts with what an
//   earlier launch fetched (readSavedConfigs). Waiting longer would get configs only from a network that is slow but
//   answers, and the file is 2 kilobytes.
// - In CI on macOS on 2026-11-21, in the first two attempts of one run, ten launches did not render their home view
//   in 30 seconds, with the request to jsDelivr unfinished and the one to raw.githubusercontent.com given up after its
//   10 seconds. The third attempt passed, as did the pull request's run of the same commit.
// - Measured on macOS with the production build, both hosts sent to a proxy that accepted the connections and never
//   answered: the home view rendered after 40 seconds, when Chromium gave up on the connection to jsDelivr after 30;
//   with this limit, after 20 seconds, with the fallback configs. A user whose network drops both hosts without an
//   answer waited as long.
// - 10 seconds is what the first address has had since the limit came. It is plenty for a file of 2 kilobytes:
//   jsDelivr answered in 0.5 seconds when raw.githubusercontent.com did not
//   (docs/tasks/20261121_launch-loading-screen/REPORT.md). 20 seconds in all is within the 30 that the e2e suite waits
//   for the home view (test/e2e/regression.spec.mjs), so that a launch in CI whose hosts do not answer starts rather
//   than failing.
// - The fallback configs lack only what photo-location-map-resources has changed since the release, and only for a
//   launch that neither fetches nor has saved configs: in November 2026, they list the same four maps as the file. A
//   limit for each attempt, rather than one for the whole wait, also ends the request that is given up.
// - Each attempt makes its signal as it starts (fetchRasterTileBaseLayerConfigsVersion1): AbortSignal.timeout()
//   counts from when it is called, so a signal made in this list would count the last attempt's time from the first
//   attempt's start.
export const configsFileFetchAttempts: readonly ConfigsFileFetchAttempt[] = [
  {
    url: rasterTileBaseLayerConfigsVersion1Urls.gitHub,
    timeoutMilliseconds: 10000,
  },
  {
    url: rasterTileBaseLayerConfigsVersion1Urls.jsDelivr,
    timeoutMilliseconds: 10000,
  },
];

async function fetchRasterTileBaseLayerConfigsVersion1(url: string, timeoutMilliseconds: number): Promise<{configs: RasterTileBaseLayerConfigsVersion1, responseText: string}> {
  // The signal also ends the reading of the answer's body, which a server can leave unfinished as well.
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMilliseconds) });
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
  logger.errorNotRecorded(message);  // Recorded as the event below.
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Invalid BaseLayerConfigs`, message);
}

function recordFetchSuccess(url: string, configs: RasterTileBaseLayerConfigsVersion1, responseText: string): void {
  const message = `Fetched ${url}\n----------\nconfigs:\n${toLoggableString(configs)}\n----------\nresponseText:\n${responseText}`;
  logger.info(message);
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fetched BaseLayerConfigs`, message);
}

function recordFetchFailed(url: string, error: Error): void {
  const message = `Failed to fetch ${url}. error.message: "${error.message}"`;
  logger.errorNotRecorded(message);  // Recorded as the event below.
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Failed to fetch configs`, message);
}

function recordUsingSavedConfigs(): void {
  const message = `Failed to fetch the configs from all the possible URLs. Using the configs that an earlier launch saved.`;
  logger.errorNotRecorded(message);  // Recorded as the event below.
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Saved BaseLayerConfigs`, message);
}

function recordInvalidSavedConfigs(savedText: string): void {
  const message = `The saved configs are not valid configs, and are not used.`;
  logger.errorNotRecorded(`${message}\n----------\nsaved:\n${savedText}`);  // Recorded as the event below, without what is saved.
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Invalid saved BaseLayerConfigs`, message);
}

function recordFetchFailedForAllUrls(): void {
  const message = `Failed to fetch the configs from all the possible URLs, and none are saved. Using the fallback configs.`;
  logger.errorNotRecorded(message);  // Recorded as the event below.
  Analytics.trackEvent('Leaflet Map', `[Leaflet Map] Fallback BaseLayerConfigs`, message);
}

/**
 * The base layers of the app's own (dated-layers/dated-layers.ts) that `configs` asks the app not to show, by the
 * names that the map's list of layers gives them: none when hiddenBuiltInBaseLayers is missing or is not a list.
 * TL;DR: So that a map that the app has of its own can be taken off the map's list of layers without a release, as
 * when its service asks the app to stop showing it. A map of the configs is taken off by taking it out of the configs.
 * Details:
 * - A name of no such layer, and a value that is not a string, hide nothing.
 * - The page reads the configs once, when it starts, so a layer hidden, or shown again, changes at the next launch.
 * - The configs that an earlier launch saved hide what they hid when it fetched them (readSavedConfigs), and the
 *   fallback configs hide nothing.
 * - Releases up to 1.13.0 read only rasterTileBaseLayerConfigs of the file, so the field does not change them, and
 *   they have none of these layers.
 */
export function hiddenBuiltInBaseLayersOf(configs: RasterTileBaseLayerConfigsVersion1): ReadonlySet<string> {
  const names: unknown = configs.hiddenBuiltInBaseLayers;
  return new Set(Array.isArray(names) ? names.filter((name): name is string => typeof name === 'string') : []);
}

/** Whether `configs` has base layers to show: what fetched configs, and saved ones, need to be used. */
function hasBaseLayers(configs: RasterTileBaseLayerConfigsVersion1 | undefined): boolean {
  return Array.isArray(configs?.rasterTileBaseLayerConfigs) && configs.rasterTileBaseLayerConfigs.length > 0;
}

const savedConfigsPath = UserDataStoragePath.LeafletMap.RasterTileBaseLayerConfigsVersion1;

/**
 * Saves `configs`, which a fetch gave, for a launch whose fetches give none (readSavedConfigs). They are written only
 * when they differ from those saved, as the file changes far less often than the app is launched. The page goes on
 * with them whether or not they are written.
 */
function saveFetchedConfigs(configs: RasterTileBaseLayerConfigsVersion1): void {
  try {
    const text = JSON.stringify(configs);
    if (UserDataStorage.readOrDefault(savedConfigsPath, '') !== text)
      UserDataStorage.write(savedConfigsPath, text);  // A failure to write is logged and recorded where it is written.
  } catch (error) {
    logger.error('Failed to save the fetched configs.', error);
  }
}

/**
 * The configs that an earlier launch fetched and saved (saveFetchedConfigs): undefined when none are saved, or when
 * what is saved is not valid configs.
 * TL;DR: They come before the fallback configs, which are the file as it was at the release: they are the file as a
 * launch on this computer last fetched it, mostly later than that.
 * Details: A copy saved before an update can be older than the fallback configs of the update, when the file changed
 * between the two. It is used only until a fetch gives configs again, and the file seldom changes: it had changed
 * three times by November 2026, last in March 2025.
 */
function readSavedConfigs(): RasterTileBaseLayerConfigsVersion1 | undefined {
  const savedText = UserDataStorage.readOrDefault(savedConfigsPath, '');
  if (!savedText)
    return undefined;
  let configs: RasterTileBaseLayerConfigsVersion1 | undefined;
  try {
    configs = JSON.parse(savedText);
  } catch {
    configs = undefined;
  }
  if (hasBaseLayers(configs))
    return configs;
  recordInvalidSavedConfigs(savedText);
  return undefined;
}

/**
 * Fetches the configs from each address in turn, and saves those that one gives. When none of them gives valid configs
 * in its time, gives the configs that an earlier launch saved, or else the fallback configs. The attempts are
 * configsFileFetchAttempts, or shorter ones in the tests.
 */
export async function fetchRasterTileBaseLayerConfigsVersion1WithRetry(
  attempts: readonly ConfigsFileFetchAttempt[] = configsFileFetchAttempts): Promise<RasterTileBaseLayerConfigsVersion1> {
  for (const {url, timeoutMilliseconds} of attempts) {
    try {
      recordFetchingConfigs(url);
      const {configs, responseText} = await fetchRasterTileBaseLayerConfigsVersion1(url, timeoutMilliseconds);
      if (!hasBaseLayers(configs)) {
        recordInvalidConfigsObjectError(url, configs, responseText);
        continue;
      }
      recordFetchSuccess(url, configs, responseText);
      saveFetchedConfigs(configs);  // Does not throw: a failure to save is not a failure to fetch.
      return configs;
    } catch (error) {
      recordFetchFailed(url, error);
    }
  }

  const savedConfigs = readSavedConfigs();
  if (savedConfigs) {
    recordUsingSavedConfigs();
    return savedConfigs;
  }
  recordFetchFailedForAllUrls();
  return rasterTileBaseLayerConfigsVersion1Fallback;
}

export let rasterTileBaseLayerConfigsVersion1: RasterTileBaseLayerConfigsVersion1;

const configsReady = fetchRasterTileBaseLayerConfigsVersion1WithRetry().then(configs => {
  rasterTileBaseLayerConfigsVersion1 = configs;
});

export async function initializeRasterTileBaseLayerConfigs(): Promise<void> {
  await configsReady;
}
