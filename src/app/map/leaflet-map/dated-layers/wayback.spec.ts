import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import {
  captureDateOf, centerOf, distinctVersions, identifyUrl, maxVersions, releasesOf, releasesThatChanged, tileAt, tilemapUrl,
  versionsAt, versionShownIn, WaybackRelease, WaybackVersion,
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

/** A source of imagery as the metadata's identify answers it, shown at zoom `min` to `max`. */
const source = (date: string, min: number, max: number) => ({ attributes: { SRC_DATE: date, MinMapLevel: String(min), MaxMapLevel: String(max) } });

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

  it('tells when the imagery shown at a zoom was taken, from the source whose levels include it', () => {
    const answer = { results: [source('20250421', 16, 19), source('20240824', 12, 15), source('Null', 0, 11)] };

    expect(captureDateOf(answer, 17)).toBe('2025-04-21');
    expect(captureDateOf(answer, 13)).toBe('2024-08-24');
    expect(captureDateOf(answer, 8)).toBeNull();
    expect(captureDateOf({ results: [] }, 17)).toBeNull();
    expect(captureDateOf({ error: { code: 500 } }, 17)).toBeNull();
  });

  it('walks back through the releases in which a tile changed, one request for each', async () => {
    const tile = { z: 17, x: 114827, y: 52072 };
    const { fetcher, asked } = fetcherOf({
      [tilemapUrl(release(3692), tile)]: { data: [1], select: [49059] },
      [tilemapUrl(release(22869), tile)]: { data: [1], select: [49999] },
      [tilemapUrl(release(6543), tile)]: { data: [1], select: [52930] },
    });

    // The walk ends with the list, after 52930.
    const changed = await releasesThatChanged(releases, tile, fetcher);

    expect(changed.map(({ number }) => number)).toEqual([49059, 49999, 52930]);
    expect(asked).toEqual([tilemapUrl(release(3692), tile), tilemapUrl(release(22869), tile), tilemapUrl(release(6543), tile)]);
  });

  it('stops where a release has no tile, and refuses a tilemap that would walk forward', async () => {
    const tile = { z: 3, x: 6, y: 3 };
    const { fetcher } = fetcherOf({ [tilemapUrl(release(3692), tile)]: { data: [0] } });
    expect(await releasesThatChanged(releases, tile, fetcher)).toEqual([]);

    const forward = fetcherOf({
      [tilemapUrl(release(3692), tile)]: { data: [1], select: [22869] },
      [tilemapUrl(release(49999), tile)]: { data: [1], select: [3692] },
    });
    await expect(releasesThatChanged(releases, tile, forward.fetcher)).rejects.toThrow(/names release 3692/);
  });

  it('looks for no more than its most versions', async () => {
    // Releases in which the tile changed each time, as a tile of a low zoom can.
    const many: WaybackRelease[] = Array.from({ length: maxVersions + 5 }, (_, index) =>
      ({ number: index + 1, date: '2020-01-01', metadataUrl: metadata('x') }));
    const fetcher = async () => new Response(JSON.stringify({ data: [1] }));

    expect((await releasesThatChanged(many, { z: 3, x: 6, y: 3 }, fetcher)).length).toBe(maxVersions);
  });

  it('gives each version the date when its imagery at the point was taken, at the zoom', async () => {
    const tile = tileAt(34.6495, 135.3840, 17);
    const { fetcher } = fetcherOf({
      [tilemapUrl(release(3692), tile)]: { data: [1], select: [49059] },
      [tilemapUrl(release(22869), tile)]: { data: [1], select: [49999] },
      [tilemapUrl(release(6543), tile)]: { data: [1], select: [52930] },
      [identifyUrl(release(49059), 34.6495, 135.3840)]: { results: [source('20251127', 13, 19)] },
      [identifyUrl(release(49999), 34.6495, 135.3840)]: { results: [source('20250421', 16, 19), source('20240824', 12, 15)] },
      [identifyUrl(release(52930), 34.6495, 135.3840)]: { results: [source('20230910', 12, 19)] },
    });

    const versions = await versionsAt(releases, 34.6495, 135.3840, 17, fetcher);

    expect(versions.map(({ release: { number }, captureDate }) => `${number} ${captureDate}`))
      .toEqual(['49059 2025-11-27', '49999 2025-04-21', '52930 2023-09-10']);
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
