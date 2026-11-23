import { inject, Service, signal } from '@angular/core';
import moment from 'moment';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { centerOf, releasesOf, tileAt, versionsAt, WaybackRelease, WaybackVersion } from './wayback';
import { WaybackDateCache } from './wayback-date-cache';

/**
 * How long Wayback may take to answer for the map: its list of releases, or the versions at a place. Their requests
 * are then stopped, and they fail, rather than leave the map's date loading for good.
 */
export const waybackTimeoutMs = 60_000;

/** The versions at a place, while they are looked up and once they are known. */
interface VersionsLookup {
  readonly versions: Promise<WaybackVersion[]>;
  /** Stops the lookup's requests. */
  readonly stop: AbortController;
  /** How many callers wait for the versions. A caller without a signal waits for good. */
  waiting: number;
  /** Whether the lookup has ended, with the versions, which are kept, or with a failure. */
  ended: boolean;
}

/**
 * What the map's layers of a past date keep apart from the map (DatedLayers), which they are made with: the dates that
 * the user chose, and what Esri World Imagery Wayback answered, which WaybackDateCache keeps on the computer too.
 */
@Service()
export class MapDateService {
  /**
   * Whether each layer of a past date shows the date of the photos on the map, rather than the one chosen: each layer
   * on its own, as a date chosen in one says nothing of the other.
   */
  public readonly matchPhotoDates = { wayback: signal(true), openHistoricalMap: signal(true) } as const;
  /** The release of Wayback that the user chose, by its number, or null for the newest one. */
  public readonly chosenRelease = signal<number | null>(null);
  /** The release of Wayback that the map shows, chosen or matched to the photos, or null before one is known. */
  public readonly shownRelease = signal<number | null>(null);
  /** The date of OpenHistoricalMap that the user chose, YYYY-MM-DD: today until they choose one. */
  public readonly chosenDate = signal(moment().format('YYYY-MM-DD'));

  private readonly cache = inject(WaybackDateCache);
  private releases: Promise<WaybackRelease[]> | null = null;
  private readonly versions = new Map<string, VersionsLookup>();

  /**
   * The releases of Wayback, newest first, fetched once; again after a failure. Those that WaybackDateCache kept less
   * than a day ago are not fetched, so that a place kept is shown at once after a restart too.
   */
  public waybackReleases(): Promise<WaybackRelease[]> {
    this.releases ??= this.cache.releases()
      .then(async kept => {
        if (kept)
          return kept;
        const response = await fetch(waybackUrls.releases, { signal: AbortSignal.timeout(waybackTimeoutMs) });
        if (!response.ok)
          throw new Error(`${waybackUrls.releases} answered ${response.status} ${response.statusText}`);
        const releases = releasesOf(await response.json());
        await this.cache.saveReleases(releases);
        return releases;
      })
      .catch(error => {
        this.releases = null;
        throw error;
      });
    return this.releases;
  }

  /**
   * The versions of Wayback's imagery at a point at a zoom level, newest first, with when each was taken.
   * TL;DR: Looked up at the middle of a quarter of a quarter of the map's tile that has the point, so that a map moved
   * a little asks nothing again. A lookup stops when no caller waits for it any more, as when the map has moved on.
   * Details:
   * - The versions are those of the map's tile, and the dates when they were taken are those at a point, which can
   *   differ within a tile: a sixteenth of a tile, 600 m at zoom 12 and 40 m at zoom 16, is close enough to the map's
   *   center.
   * - The caller aborts `signal` when it no longer waits. A lookup that no caller waits for is stopped, as its requests
   *   would hold up those of the place that the map shows now: Chromium asks Esri's servers, of HTTP/1.1, 6 requests at
   *   a time, and a lookup asks for up to 40 dates (wayback.ts). The place is looked up again when it is asked again.
   * - A lookup that has not ended in `waybackTimeoutMs` is stopped too, and fails.
   * - The versions found are kept on the computer (WaybackDateCache). A place kept is shown at once, after a restart
   *   too: only the releases published since it was looked up are asked about, often with one request.
   */
  public waybackVersionsAt(latitude: number, longitude: number, zoom: number, signal?: AbortSignal): Promise<WaybackVersion[]> {
    const spot = tileAt(latitude, longitude, zoom + 2);
    const key = `${zoom}/${spot.x}/${spot.y}`;
    let lookup = this.versions.get(key);
    if (!lookup) {
      const stop = new AbortController();
      const timeout = setTimeout(() => stop.abort(new Error(`The versions at ${key} took longer than ${waybackTimeoutMs} ms.`)),
        waybackTimeoutMs);
      const { latitude: spotLatitude, longitude: spotLongitude } = centerOf(spot);
      const created: VersionsLookup = {
        versions: this.waybackReleases()
          .then(async releases => {
            const kept = await this.cache.place(key, releases);
            const versions = await versionsAt(releases, spotLatitude, spotLongitude, zoom, url => fetch(url, { signal: stop.signal }),
              kept.known);
            await this.cache.savePlace(key, releases[0].number, versions, kept.kept);
            return versions;
          })
          .catch(error => {
            this.forget(key, created);
            throw error;
          })
          .finally(() => {
            clearTimeout(timeout);
            created.ended = true;
          }),
        stop,
        waiting: 0,
        ended: false,
      };
      lookup = created;
      this.versions.set(key, lookup);
    }
    const waited = lookup;
    waited.waiting++;
    signal?.addEventListener('abort', () => {
      waited.waiting--;
      if (waited.waiting > 0 || waited.ended)
        return;
      this.forget(key, waited);
      waited.stop.abort(signal.reason);
    }, { once: true });
    return waited.versions;
  }

  /** Forgets the lookup of `key`, unless another has taken its place. */
  private forget(key: string, lookup: VersionsLookup): void {
    if (this.versions.get(key) === lookup)
      this.versions.delete(key);
  }

  /** The release of `releases` that the user chose, or the newest. */
  public chosenReleaseOf(releases: readonly WaybackRelease[]): WaybackRelease {
    return releases.find(release => release.number === this.chosenRelease()) ?? releases[0];
  }
}
