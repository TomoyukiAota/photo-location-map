import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import {
  captureDateOf, centerOf, distinctVersions, maxVersions, metadataLayerOf, metadataQueryUrl, releasesOf, releasesThatChanged,
  tileAt, tilemapUrl, versionsAt, versionShownIn, WaybackRelease, WaybackVersion,
} from './wayback';

const metadata = (name: string) => `${waybackUrls.metadata}World_Imagery_Metadata_${name}/MapServer`;

/** Releases as waybackconfig.json lists them, with those of the ring of EXPO 2025 (wayback_capture_dates.py). */
const config = {
  '3692': { itemTitle: 'World Imagery (Wayback 2026-11-18)', metadataLayerUrl: metadata('2026_r11') },
  '49059': { itemTitle: 'World Imagery (Wayback 2026-04-30)', metadataLayerUrl: metadata('2026_r04') },
  '22869': { itemTitle: 'World Imagery (Wayback 2026-03-26)', metadataLayerUrl: metadata('2026_r03') },
  '49999': { itemTitle: 'World Imagery (Wayback 2025-07-31)', metadataLayerUrl: metadata('2025_r07') },
  '6543': { itemTitle: 'World Imagery (Wayback 2025-03-27)', metadataLayerUrl: metadata('2025_r03') },
  '52930': { itemTitle: 'World Imagery (Wayback 2024-05-09)', metadataLayerUrl: metadata('2024_r05') },
};
const releases = releasesOf(config);
const release = (number: number) => releases.find(candidate => candidate.number === number);

/** A source of imagery as a query of the metadata answers it, shown at zoom `min` to `max`. */
const source = (date: string, min: number, max: number) => ({ attributes: { SRC_DATE: Number(date), MinMapLevel: min, MaxMapLevel: max } });

/** The tilemaps of the releases at the ring of EXPO 2025 at zoom 17, which changed in 49059, 49999 and 52930. */
function ringTilemaps(tile: { z: number, x: number, y: number }): Record<string, unknown> {
  return {
    [tilemapUrl(release(3692), tile)]: { data: [1], select: [49059] },
    [tilemapUrl(release(49059), tile)]: { data: [1], select: [49059] },
    [tilemapUrl(release(22869), tile)]: { data: [1], select: [49999] },
    [tilemapUrl(release(49999), tile)]: { data: [1], select: [49999] },
    [tilemapUrl(release(6543), tile)]: { data: [1], select: [52930] },
    // As a tilemap answers for a release in which the tile changed, without `select`.
    [tilemapUrl(release(52930), tile)]: { data: [1] },
  };
}

/** A fetch that answers from `answers`, by address, and fails for any other. */
function fetcherOf(answers: Record<string, unknown>) {
  const asked: string[] = [];
  const fetcher = async (url: string) => {
    asked.push(url);
    if (!(url in answers))
      return new Response('Not found', { status: 404, statusText: 'Not Found' });
    return new Response(JSON.stringify(answers[url]));
  };
  return { fetcher, asked };
}

describe('Esri World Imagery Wayback', () => {
  it('lists the releases newest first, without those it cannot read or whose metadata the page may not fetch', () => {
    const listed = releasesOf({
      ...config,
      'abc': { itemTitle: 'World Imagery (Wayback 2026-01-01)', metadataLayerUrl: metadata('x') },
      '1': { itemTitle: 'World Imagery', metadataLayerUrl: metadata('x') },
      '2': { itemTitle: 'World Imagery (Wayback 2026-01-01)', metadataLayerUrl: 'https://example.com/MapServer' },
    });

    expect(listed.map(({ number, date }) => `${date} ${number}`)).toEqual([
      '2026-11-18 3692', '2026-04-30 49059', '2026-03-26 22869', '2025-07-31 49999', '2025-03-27 6543', '2024-05-09 52930',
    ]);
    expect(listed[0].metadataUrl).toBe(metadata('2026_r11'));
    expect(() => releasesOf({})).toThrow(/no release/);
    expect(() => releasesOf(null)).toThrow(/not an object/);
  });

  it('numbers tiles as Leaflet does, and finds their middle', () => {
    // The ring of EXPO 2025 at zoom 17, as its tiles are numbered.
    expect(tileAt(34.6495, 135.3840, 17)).toEqual({ z: 17, x: 114827, y: 52072 });
    const middle = centerOf({ z: 17, x: 114827, y: 52072 });
    expect(tileAt(middle.latitude, middle.longitude, 17)).toEqual({ z: 17, x: 114827, y: 52072 });
    expect(tilemapUrl(release(3692), { z: 17, x: 114827, y: 52072 })).toBe(`${waybackUrls.tilemap}3692/17/52072/114827`);
  });

  it('queries the layer of the metadata that has the zoom, and tells when the imagery shown at it was taken', () => {
    // A layer for each zoom from 23 to 10, which has the zooms below it too.
    expect([23, 19, 17, 12, 10, 8, 25].map(metadataLayerOf)).toEqual([0, 4, 6, 11, 13, 13, 0]);
    const url = new URL(metadataQueryUrl(release(49999), 34.6495, 135.3840, 17));
    expect(`${url.origin}${url.pathname}`).toBe(`${metadata('2025_r07')}/6/query`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      geometry: '135.384,34.6495', geometryType: 'esriGeometryPoint', inSR: '4326', spatialRel: 'esriSpatialRelIntersects',
      outFields: 'SRC_DATE,MinMapLevel,MaxMapLevel', returnGeometry: 'false', f: 'json',
    });

    // The source whose levels include the zoom.
    const answer = { features: [source('20240824', 12, 15), source('20250421', 16, 19), source('0', 0, 11)] };
    expect(captureDateOf(answer, 17)).toBe('2025-04-21');
    expect(captureDateOf(answer, 13)).toBe('2024-08-24');
    expect(captureDateOf(answer, 8)).toBeNull();
    expect(captureDateOf({ features: [] }, 17)).toBeNull();
    expect(captureDateOf({ error: { code: 500 } }, 17)).toBeNull();
  });

  it('walks back through the releases in which a tile changed, in stretches of the list at once, as one walk does', async () => {
    const tile = { z: 17, x: 114827, y: 52072 };
    const walk = async (walks?: number) => {
      const { fetcher, asked } = fetcherOf(ringTilemaps(tile));
      const changed = await releasesThatChanged(releases, tile, fetcher, walks);
      return { changed: changed.map(({ number }) => number), asked };
    };

    // One walk: a request for each version, and the walk ends with the list, after 52930.
    const one = await walk(1);
    expect(one.changed).toEqual([49059, 49999, 52930]);
    expect(one.asked).toEqual([tilemapUrl(release(3692), tile), tilemapUrl(release(22869), tile), tilemapUrl(release(6543), tile)]);

    // Two stretches of three: the first finds 49059, and leaves 49999 to the second, which starts at it.
    const two = await walk(2);
    expect(two.changed).toEqual([49059, 49999, 52930]);
    expect([...two.asked].sort()).toEqual([3692, 22869, 49999, 6543].map(number => tilemapUrl(release(number), tile)).sort());

    // As many stretches as releases, as when there are fewer releases than walks: each asks once.
    const each = await walk();
    expect(each.changed).toEqual([49059, 49999, 52930]);
    expect(each.asked).toHaveLength(releases.length);
  });

  it('stops where a release has no tile, and refuses a tilemap that would walk forward', async () => {
    const tile = { z: 3, x: 6, y: 3 };
    // No release has the tile, as none before the first one that has none.
    const none = async () => new Response(JSON.stringify({ data: [0] }));
    expect(await releasesThatChanged(releases, tile, none)).toEqual([]);
    expect(await releasesThatChanged(releases, tile, none, 1)).toEqual([]);

    const forward = fetcherOf({
      [tilemapUrl(release(3692), tile)]: { data: [1], select: [22869] },
      [tilemapUrl(release(49999), tile)]: { data: [1], select: [3692] },
    });
    await expect(releasesThatChanged(releases, tile, forward.fetcher, 1)).rejects.toThrow(/names release 3692/);
  });

  it('gives no more than its most versions, the newest', async () => {
    // Releases in which the tile changed each time, as a tile of a low zoom can.
    const many: WaybackRelease[] = Array.from({ length: maxVersions + 5 }, (_, index) =>
      ({ number: index + 1, date: '2020-01-01', metadataUrl: metadata('x') }));
    const fetcher = async () => new Response(JSON.stringify({ data: [1] }));
    const newest = many.slice(0, maxVersions).map(({ number }) => number);

    expect((await releasesThatChanged(many, { z: 3, x: 6, y: 3 }, fetcher)).map(({ number }) => number)).toEqual(newest);
    expect((await releasesThatChanged(many, { z: 3, x: 6, y: 3 }, fetcher, 1)).map(({ number }) => number)).toEqual(newest);
  });

  it('gives each version the date when its imagery at the point was taken, at the zoom', async () => {
    const tile = tileAt(34.6495, 135.3840, 17);
    const { fetcher, asked } = fetcherOf({
      ...ringTilemaps(tile),
      [metadataQueryUrl(release(49059), 34.6495, 135.3840, 17)]: { features: [source('20251127', 13, 19)] },
      [metadataQueryUrl(release(49999), 34.6495, 135.3840, 17)]: { features: [source('20250421', 16, 19)] },
      [metadataQueryUrl(release(52930), 34.6495, 135.3840, 17)]: { features: [source('20230910', 12, 19)] },
    });

    const versions = await versionsAt(releases, 34.6495, 135.3840, 17, fetcher);

    expect(versions.map(({ release: { number }, captureDate }) => `${number} ${captureDate}`))
      .toEqual(['49059 2025-11-27', '49999 2025-04-21', '52930 2023-09-10']);
    // A query for each version, and nothing else of the metadata.
    expect(asked.filter(url => url.startsWith(waybackUrls.metadata))).toHaveLength(3);
  });

  it('asks about the releases newer than those of the versions known only, and keeps the known ones', async () => {
    const tile = tileAt(34.6495, 135.3840, 17);
    const known = {
      newestRelease: 22869,
      versions: [{ release: release(49999), captureDate: '2025-04-21' }, { release: release(52930), captureDate: '2023-09-10' }],
    };
    const ask = async (answers: Record<string, unknown>, knownVersions = known) => {
      const { fetcher, asked } = fetcherOf(answers);
      const versions = await versionsAt(releases, 34.6495, 135.3840, 17, fetcher, knownVersions);
      return { versions: versions.map(({ release: { number }, captureDate }) => `${number} ${captureDate}`), asked };
    };

    // The newest release known: nothing is asked.
    expect(await ask({}, { ...known, newestRelease: 3692 })).toEqual({ versions: ['49999 2025-04-21', '52930 2023-09-10'], asked: [] });
    // Two releases since, in one of which the tile changed: their tilemaps, and the date of the new version.
    const since = await ask({
      [tilemapUrl(release(3692), tile)]: { data: [1], select: [49059] },
      [tilemapUrl(release(49059), tile)]: { data: [1] },
      [metadataQueryUrl(release(49059), 34.6495, 135.3840, 17)]: { features: [source('20251127', 13, 19)] },
    });
    expect(since.versions).toEqual(['49059 2025-11-27', '49999 2025-04-21', '52930 2023-09-10']);
    expect(since.asked).toHaveLength(3);
    // A newest release that the list no longer has: everything is asked again.
    const again = await ask({
      ...ringTilemaps(tile),
      [metadataQueryUrl(release(49059), 34.6495, 135.3840, 17)]: { features: [source('20251127', 13, 19)] },
      [metadataQueryUrl(release(49999), 34.6495, 135.3840, 17)]: { features: [source('20250421', 16, 19)] },
      [metadataQueryUrl(release(52930), 34.6495, 135.3840, 17)]: { features: [source('20230910', 12, 19)] },
    }, { ...known, newestRelease: 1 });
    expect(again.versions).toEqual(['49059 2025-11-27', '49999 2025-04-21', '52930 2023-09-10']);
  });

  it('keeps one version for each date taken, the newest, and finds the version that a release shows', () => {
    const version = (number: number, captureDate: string | null): WaybackVersion => ({ release: release(number), captureDate });
    const versions = [version(49059, '2025-11-27'), version(22869, '2025-04-21'), version(49999, '2025-04-21'), version(6543, null),
      version(52930, null)];

    expect(distinctVersions(versions)).toEqual([versions[0], versions[1], versions[3], versions[4]]);
    expect(versionShownIn(versions, release(3692))).toBe(versions[0]);
    expect(versionShownIn(versions, release(49999))).toBe(versions[2]);
    expect(versionShownIn([version(49059, '2025-11-27')], release(52930))).toBeUndefined();
  });
});
