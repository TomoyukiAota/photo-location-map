import { Service, signal } from '@angular/core';
import moment from 'moment';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import { centerOf, releasesOf, tileAt, versionsAt, WaybackRelease, WaybackVersion } from './wayback';

/**
 * What the map's layers of a past date keep apart from the map (DatedLayers), which they are made with: the dates that
 * the user chose, and what Esri World Imagery Wayback answered.
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

  private releases: Promise<WaybackRelease[]> | null = null;
  private readonly versions = new Map<string, Promise<WaybackVersion[]>>();

  /** The releases of Wayback, newest first, fetched once; again after a failure. */
  public waybackReleases(): Promise<WaybackRelease[]> {
    this.releases ??= fetch(waybackUrls.releases)
      .then(response => {
        if (!response.ok)
          throw new Error(`${waybackUrls.releases} answered ${response.status} ${response.statusText}`);
        return response.json();
      })
      .then(releasesOf)
      .catch(error => {
        this.releases = null;
        throw error;
      });
    return this.releases;
  }

  /**
   * The versions of Wayback's imagery at a point at a zoom level, newest first, with when each was taken.
   * TL;DR: Looked up at the middle of a quarter of a quarter of the map's tile that has the point, so that a map moved
   * a little asks nothing again.
   * Details: The versions are those of the map's tile, and the dates when they were taken are those at a point, which
   * can differ within a tile: a sixteenth of a tile, 600 m at zoom 12 and 40 m at zoom 16, is close enough to the
   * map's center.
   */
  public waybackVersionsAt(latitude: number, longitude: number, zoom: number): Promise<WaybackVersion[]> {
    const spot = tileAt(latitude, longitude, zoom + 2);
    const key = `${zoom}/${spot.x}/${spot.y}`;
    let versions = this.versions.get(key);
    if (!versions) {
      const { latitude: spotLatitude, longitude: spotLongitude } = centerOf(spot);
      versions = this.waybackReleases()
        .then(releases => versionsAt(releases, spotLatitude, spotLongitude, zoom, url => fetch(url)))
        .catch(error => {
          this.versions.delete(key);
          throw error;
        });
      this.versions.set(key, versions);
    }
    return versions;
  }

  /** The release of `releases` that the user chose, or the newest. */
  public chosenReleaseOf(releases: readonly WaybackRelease[]): WaybackRelease {
    return releases.find(release => release.number === this.chosenRelease()) ?? releases[0];
  }
}
