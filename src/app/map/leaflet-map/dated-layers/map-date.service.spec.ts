import { TestBed } from '@angular/core/testing';
import { WaybackDateStoreDouble } from '../../../../../test/angular/wayback-date-store-double';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { MapDateService, waybackTimeoutMs } from './map-date.service';
import { centerOf, releasesOf, tileAt, tilemapUrl } from './wayback';
import { openWaybackDateStore } from './wayback-date-cache';

const metadata = `${waybackUrls.metadata}World_Imagery_Metadata_2026_r11/MapServer`;
const config = { '3692': { itemTitle: 'World Imagery (Wayback 2026-11-18)', metadataLayerUrl: metadata } };

describe('MapDateService', () => {
  let service: MapDateService;
  let fetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = TestBed.inject(MapDateService);
    fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('matches the dates of the photos in each layer until told otherwise, and shows today on OpenHistoricalMap when not', () => {
    expect(service.matchPhotoDates.wayback()).toBe(true);
    expect(service.matchPhotoDates.openHistoricalMap()).toBe(true);
    expect(service.chosenDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(service.chosenRelease()).toBeNull();
    expect(service.shownRelease()).toBeNull();
  });

  it('fetches the releases once, and again after a failure', async () => {
    fetch.mockResolvedValueOnce(new Response('Busy', { status: 503, statusText: 'Service Unavailable' }));
    await expect(service.waybackReleases()).rejects.toThrow(/503/);

    fetch.mockResolvedValue(new Response(JSON.stringify(config)));
    const releases = await service.waybackReleases();
    await service.waybackReleases();

    expect(releases.map(release => release.number)).toEqual([3692]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(waybackUrls.releases, { signal: expect.any(AbortSignal) });
    expect(service.chosenReleaseOf(releases).number).toBe(3692);
  });

  it('asks for the versions at a point once for a sixteenth of the map\'s tile, at its middle', async () => {
    fetch.mockImplementation(async (url: string) => new Response(JSON.stringify(url === waybackUrls.releases
      ? config
      : url.startsWith(waybackUrls.tilemap) ? { data: [1] } : { features: [] })));

    const versions = await service.waybackVersionsAt(34.6495, 135.3840, 17);
    // Another point in the same sixteenth of the tile: its middle.
    const middle = centerOf(tileAt(34.6495, 135.3840, 19));
    await service.waybackVersionsAt(middle.latitude, middle.longitude, 17);

    expect(versions.map(version => version.release.number)).toEqual([3692]);
    // The list, the tilemap of the only release, and the query of its metadata.
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  describe('with a server that answers the list at once, and nothing else until a request is stopped', () => {
    /** The signals of the requests other than for the list. */
    let requests: AbortSignal[];

    beforeEach(() => {
      requests = [];
      fetch.mockImplementation((url: string, init: RequestInit) => {
        if (url === waybackUrls.releases)
          return Promise.resolve(new Response(JSON.stringify(config)));
        requests.push(init.signal);
        return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
      });
    });

    it('stops a lookup once none of its callers waits for it, and looks the place up again when asked again', async () => {
      const first = new AbortController();
      const second = new AbortController();
      const versions = service.waybackVersionsAt(34.6495, 135.3840, 17, first.signal);
      // Another caller, at the same place, as a refresh of the map that has not moved.
      service.waybackVersionsAt(34.6495, 135.3840, 17, second.signal).catch(() => undefined);
      await vi.waitFor(() => expect(requests).toHaveLength(1));

      first.abort();
      expect(requests[0].aborted).toBe(false);
      second.abort();
      expect(requests[0].aborted).toBe(true);
      await expect(versions).rejects.toThrow();

      service.waybackVersionsAt(34.6495, 135.3840, 17).catch(() => undefined);
      await vi.waitFor(() => expect(requests).toHaveLength(2));
      expect(requests[1].aborted).toBe(false);
    });

    it('stops a lookup that takes longer than its time, which then fails', async () => {
      vi.useFakeTimers();
      try {
        const versions = service.waybackVersionsAt(34.6495, 135.3840, 17);
        const failed = expect(versions).rejects.toThrow(/took longer than/);
        await vi.waitFor(() => expect(requests).toHaveLength(1));

        await vi.advanceTimersByTimeAsync(waybackTimeoutMs);

        expect(requests[0].aborted).toBe(true);
        await failed;
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('keeps the versions found after their callers stop waiting', async () => {
    fetch.mockImplementation(async (url: string) => new Response(JSON.stringify(url === waybackUrls.releases
      ? config
      : url.startsWith(waybackUrls.tilemap) ? { data: [1] } : { features: [] })));
    const waiting = new AbortController();

    await service.waybackVersionsAt(34.6495, 135.3840, 17, waiting.signal);
    waiting.abort();
    await service.waybackVersionsAt(34.6495, 135.3840, 17);

    // The list, the tilemap and the query, once.
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe('MapDateService, with what Wayback answered kept on the computer', () => {
  /** Two releases, the newer one published since a place was kept. */
  const twoReleases = {
    ...config,
    '43291': { itemTitle: 'World Imagery (Wayback 2026-10-29)', metadataLayerUrl: `${waybackUrls.metadata}World_Imagery_Metadata_2026_r10/MapServer` },
  };
  // The key of the place that MapDateService looks up for the ring of EXPO 2025 at zoom 17: a sixteenth of its tile.
  const spot = tileAt(34.6495, 135.3840, 19);
  const key = `17/${spot.x}/${spot.y}`;
  let store: WaybackDateStoreDouble;
  let service: MapDateService;
  let fetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = new WaybackDateStoreDouble();
    TestBed.configureTestingModule({ providers: [{ provide: openWaybackDateStore, useValue: async () => store }] });
    service = TestBed.inject(MapDateService);
    fetch = vi.fn(async (url: string) => new Response(JSON.stringify(url === waybackUrls.releases
      ? config
      : url.startsWith(waybackUrls.tilemap) ? { data: [1] } : { features: [] })));
    vi.stubGlobal('fetch', fetch);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows the versions kept at a place, with the releases kept less than a day ago, without asking Wayback', async () => {
    store.kept = { releases: releasesOf(config), fetchedAt: Date.now() };
    store.places.set(key, { key, newestRelease: 3692, versions: [[3692, '2026-01-17']], seenAt: 1 });

    const versions = await service.waybackVersionsAt(34.6495, 135.3840, 17);

    expect(versions.map(({ release, captureDate }) => `${release.number} ${captureDate}`)).toEqual(['3692 2026-01-17']);
    expect(fetch).not.toHaveBeenCalled();
    // Looked at now, which keeps it longer than the places looked at before.
    expect(store.places.get(key).seenAt).toBeGreaterThan(1);
  });

  it('keeps the releases that it fetches, and the versions that it looks up', async () => {
    await service.waybackVersionsAt(34.6495, 135.3840, 17);

    // The list, the tilemap of the only release, and the query of its metadata.
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(store.kept.releases.map(release => release.number)).toEqual([3692]);
    expect(store.places.get(key)).toMatchObject({ newestRelease: 3692, versions: [[3692, null]] });
  });

  it('asks only about the releases published since a place was kept', async () => {
    store.kept = { releases: releasesOf(twoReleases), fetchedAt: Date.now() };
    store.places.set(key, { key, newestRelease: 43291, versions: [[43291, '2025-11-27']], seenAt: 1 });
    // The tile did not change in the new release.
    fetch.mockImplementation(async () => new Response(JSON.stringify({ data: [1], select: [43291] })));

    const versions = await service.waybackVersionsAt(34.6495, 135.3840, 17);

    expect(versions.map(({ release, captureDate }) => `${release.number} ${captureDate}`)).toEqual(['43291 2025-11-27']);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe(tilemapUrl(releasesOf(twoReleases)[0], tileAt(34.6495, 135.3840, 17)));
    expect(store.places.get(key)).toMatchObject({ newestRelease: 3692, versions: [[43291, '2025-11-27']] });
  });
});
