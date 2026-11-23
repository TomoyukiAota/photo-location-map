import { TestBed } from '@angular/core/testing';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { MapDateService, waybackTimeoutMs } from './map-date.service';
import { centerOf, tileAt } from './wayback';

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

  it('matches the dates of the photos until told otherwise, with no release chosen or shown at first', () => {
    expect(service.matchPhotoDates()).toBe(true);
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
