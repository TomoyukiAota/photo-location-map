import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';

// TL;DR: Esri World Imagery Wayback, read as Esri's own Wayback app reads it: the list of the releases, the releases
// in which the imagery at a place changed, and when that imagery was taken.
// Details:
// - A release covers the whole world, and most of its tiles are those of an earlier release, which the address of a
//   tile redirects to. The tilemap of a release names the release in which a tile last changed (`select`), so a walk
//   back from a release finds the versions of a tile one request after another: 12 at the ring of EXPO 2025 at zoom
//   17, out of 199 releases from 2014-02-20 to 2026-11-18. The list is walked in `walksAtOnce` stretches at once,
//   each from its newest release to the next stretch: in 1.0 to 1.7 seconds rather than 2.7 to 3.7 for one walk, for
//   12 to 24 versions around Osaka and Tokyo at zoom 12 to 17 (2026-11-23), with one more request for each stretch.
// - Each release has a metadata service, with a layer for each zoom level from 23 to 10 (metadataLayerOf()), whose
//   features tell the source of the imagery at a point, with the date when it was taken and the zoom levels it is
//   shown at (MinMapLevel to MaxMapLevel): at the ring, the release of 2025-07-31 shows imagery taken on 2025-04-21 at
//   zoom 16 to 19, of 2024-08-24 at 12 to 15, and an undated mosaic below. The layer of the zoom is queried for each
//   version. An identify on all 14 layers, which this asked before, gave the same dates in 10 to 19 seconds rather
//   than 2.4 to 6.4 for the same versions, asked 6 at a time, as Chromium asks a server of HTTP/1.1 such as Esri's.

/** A release of World Imagery Wayback. */
export interface WaybackRelease {
  /** Its number, in the addresses of its tiles. */
  readonly number: number;
  /** When it was published, as YYYY-MM-DD. */
  readonly date: string;
  /** Its metadata service. */
  readonly metadataUrl: string;
}

/** A version of the imagery at a place: a release in which its tile changed, and when the imagery was taken. */
export interface WaybackVersion {
  readonly release: WaybackRelease;
  /** When the imagery at the place was taken, as YYYY-MM-DD, or null when its metadata does not say. */
  readonly captureDate: string | null;
}

/** A tile of the map, as Leaflet and Wayback number them. */
export interface Tile {
  readonly z: number;
  readonly x: number;
  readonly y: number;
}

/** What fetches an address: fetch(), or a fake in the tests. */
export type Fetcher = (url: string) => Promise<Response>;

/**
 * The most versions that versionsAt() gives, the newest, and asks the dates of: a tile at a low zoom can have one in
 * each release.
 */
export const maxVersions = 40;

/** How many stretches of the list of the releases releasesThatChanged() walks at once. */
export const walksAtOnce = 8;

/**
 * The releases in the list (waybackconfig.json), newest first. An entry without a date in its title, or whose
 * metadata is not on the server that the page may connect to, is left out.
 */
export function releasesOf(config: unknown): WaybackRelease[] {
  if (!config || typeof config !== 'object')
    throw new Error('The list of the releases of World Imagery Wayback is not an object.');
  const releases: WaybackRelease[] = [];
  for (const [key, item] of Object.entries(config as Record<string, unknown>)) {
    const number = Number(key);
    const title = (item as { itemTitle?: unknown })?.itemTitle;
    const metadataUrl = (item as { metadataLayerUrl?: unknown })?.metadataLayerUrl;
    const date = typeof title === 'string' ? /\d{4}-\d{2}-\d{2}/.exec(title)?.[0] : undefined;
    if (!Number.isInteger(number) || !date || typeof metadataUrl !== 'string' || !metadataUrl.startsWith(waybackUrls.metadata))
      continue;
    releases.push({ number, date, metadataUrl });
  }
  if (releases.length === 0)
    throw new Error('The list of the releases of World Imagery Wayback has no release.');
  return releases.sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
}

/** The tile that has a point at a zoom level. */
export function tileAt(latitude: number, longitude: number, zoom: number): Tile {
  const count = 2 ** zoom;
  const clamp = (value: number) => Math.min(count - 1, Math.max(0, Math.floor(value)));
  const latitudeInRadians = latitude * Math.PI / 180;
  return {
    z: zoom,
    x: clamp((longitude + 180) / 360 * count),
    y: clamp((1 - Math.asinh(Math.tan(latitudeInRadians)) / Math.PI) / 2 * count),
  };
}

/** The point in the middle of a tile. */
export function centerOf(tile: Tile): { latitude: number, longitude: number } {
  const count = 2 ** tile.z;
  const longitude = (tile.x + 0.5) / count * 360 - 180;
  const latitude = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tile.y + 0.5) / count))) * 180 / Math.PI;
  return { latitude, longitude };
}

/** The address of the tilemap of a tile in a release. */
export function tilemapUrl(release: WaybackRelease, tile: Tile): string {
  return `${waybackUrls.tilemap}${release.number}/${tile.z}/${tile.y}/${tile.x}`;
}

/**
 * The layer of a release's metadata service that has the sources of the imagery at a zoom level: 0 for zoom 23, the
 * most detailed, to 13 for zoom 10, which has those of the levels below it too.
 */
export function metadataLayerOf(zoom: number): number {
  return Math.min(13, Math.max(0, 23 - zoom));
}

/** The address that queries a release's metadata for the sources of the imagery at a point, at a zoom level. */
export function metadataQueryUrl(release: WaybackRelease, latitude: number, longitude: number, zoom: number): string {
  const parameters = new URLSearchParams({
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'SRC_DATE,MinMapLevel,MaxMapLevel',
    returnGeometry: 'false',
    f: 'json',
  });
  return `${release.metadataUrl}/${metadataLayerOf(zoom)}/query?${parameters}`;
}

/**
 * When the imagery that a release shows at a zoom level was taken, as YYYY-MM-DD, from the answer of
 * metadataQueryUrl(): the source whose levels include the zoom. Null when none does, or when it has no date, as the
 * mosaic at low zooms.
 */
export function captureDateOf(queryAnswer: unknown, zoom: number): string | null {
  const features = (queryAnswer as { features?: unknown })?.features;
  if (!Array.isArray(features))
    return null;
  for (const feature of features) {
    const attributes = (feature as { attributes?: Record<string, unknown> })?.attributes ?? {};
    const min = Number(attributes['MinMapLevel']);
    const max = Number(attributes['MaxMapLevel']);
    if (!(min <= zoom && zoom <= max))
      continue;
    const match = /^(\d{4})(\d{2})(\d{2})$/.exec(String(attributes['SRC_DATE']));
    return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
  }
  return null;
}

async function json(fetcher: Fetcher, url: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok)
    throw new Error(`${url} answered ${response.status} ${response.statusText}`);
  return response.json();
}

/**
 * The versions of the imagery of a tile, newest first: the releases in which it changed, at most `maxVersions`, the
 * newest. Without the dates when they were taken.
 * TL;DR: Found with the tilemap, by walking back through `walks` stretches of the releases at once, each from its
 * newest release to the next stretch.
 * Details: The walk of a stretch asks the tilemap of its newest release, which names the release in which the tile
 * last changed. When that release is in the stretch, it is a version, and the walk goes on from the release before
 * it; when it is in an older stretch, the walk of that stretch finds it. A walk asks at most once more than its
 * stretch has versions, and no more times than it has releases.
 */
export async function releasesThatChanged(releases: readonly WaybackRelease[], tile: Tile, fetcher: Fetcher,
                                          walks = walksAtOnce): Promise<WaybackRelease[]> {
  const indexOf = new Map(releases.map((release, index) => [release.number, index]));
  const walk = async (start: number, end: number): Promise<WaybackRelease[]> => {
    const changed: WaybackRelease[] = [];
    let index = start;
    while (index < end && changed.length < maxVersions) {
      const tilemap = await json(fetcher, tilemapUrl(releases[index], tile)) as { data?: unknown[], select?: unknown[] };
      // No tile in this release, nor in any before it.
      if (!Array.isArray(tilemap?.data) || tilemap.data[0] !== 1)
        break;
      const selected = Array.isArray(tilemap.select) ? indexOf.get(Number(tilemap.select[0])) : index;
      // A release that the list does not have, or one that is not older: the walk would not end.
      if (selected === undefined || selected < index)
        throw new Error(`The tilemap of release ${releases[index].number} for ${tile.z}/${tile.y}/${tile.x} names release ${tilemap.select?.[0]}.`);
      // Found by the walk of an older stretch.
      if (selected >= end)
        break;
      changed.push(releases[selected]);
      index = selected + 1;
    }
    return changed;
  };
  const length = Math.ceil(releases.length / walks);
  const starts = Array.from({ length: Math.ceil(releases.length / length) }, (_, index) => index * length);
  const stretches = await Promise.all(starts.map(start => walk(start, Math.min(start + length, releases.length))));
  return stretches.flat().slice(0, maxVersions);
}

/**
 * The versions of the imagery at a point at a zoom level, newest first, with when each was taken there: the dates are
 * asked for all at once, once the versions are known.
 */
export async function versionsAt(releases: readonly WaybackRelease[], latitude: number, longitude: number, zoom: number,
                                 fetcher: Fetcher): Promise<WaybackVersion[]> {
  const changed = await releasesThatChanged(releases, tileAt(latitude, longitude, zoom), fetcher);
  return Promise.all(changed.map(async release => ({
    release,
    captureDate: captureDateOf(await json(fetcher, metadataQueryUrl(release, latitude, longitude, zoom)), zoom),
  })));
}

/**
 * The versions to choose from: one for each date when the imagery was taken, that of the newest release with it, as a
 * tile can change while its imagery at the point stays the same. Those without a date are all kept.
 */
export function distinctVersions(versions: readonly WaybackVersion[]): WaybackVersion[] {
  const seen = new Set<string>();
  return versions.filter(version => {
    if (version.captureDate === null)
      return true;
    if (seen.has(version.captureDate))
      return false;
    seen.add(version.captureDate);
    return true;
  });
}

/** The version that a release shows at the place: the newest one that is not newer than the release. */
export function versionShownIn(versions: readonly WaybackVersion[], release: WaybackRelease): WaybackVersion | undefined {
  return versions.find(version => version.release.date <= release.date);
}
