import { TestBed } from '@angular/core/testing';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { MapDateService } from './map-date.service';
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
    expect(fetch).toHaveBeenCalledWith(waybackUrls.releases);
    expect(service.chosenReleaseOf(releases).number).toBe(3692);
  });

  it('asks for the versions at a point once for a sixteenth of the map\'s tile, at its middle', async () => {
    fetch.mockImplementation(async (url: string) => new Response(JSON.stringify(url === waybackUrls.releases
      ? config
      : url.startsWith(waybackUrls.tilemap) ? { data: [1] } : { results: [] })));

    const versions = await service.waybackVersionsAt(34.6495, 135.3840, 17);
    // Another point in the same sixteenth of the tile: its middle.
    const middle = centerOf(tileAt(34.6495, 135.3840, 19));
    await service.waybackVersionsAt(middle.latitude, middle.longitude, 17);

    expect(versions.map(version => version.release.number)).toEqual([3692]);
    // The list, the tilemap of the only release, and its identify.
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
