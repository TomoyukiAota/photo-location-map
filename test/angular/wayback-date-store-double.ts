import type {
  CachedPlace, CachedReleases, WaybackDateStore,
} from '../../src/app/map/leaflet-map/dated-layers/wayback-date-cache';

/** WaybackDateCache's store in memory, for the unit tests, as jsdom has no IndexedDB. */
export class WaybackDateStoreDouble implements WaybackDateStore {
  public readonly places = new Map<string, CachedPlace>();
  public kept: CachedReleases | undefined;

  public async releases(): Promise<CachedReleases | undefined> {
    return this.kept;
  }

  public async saveReleases(releases: CachedReleases): Promise<void> {
    this.kept = releases;
  }

  public async place(key: string): Promise<CachedPlace | undefined> {
    return this.places.get(key);
  }

  public async savePlace(place: CachedPlace): Promise<void> {
    this.places.set(place.key, place);
  }

  public async count(): Promise<number> {
    return this.places.size;
  }

  public async removeOldest(count: number): Promise<void> {
    const oldest = [...this.places.values()].sort((a, b) => a.seenAt - b.seenAt).slice(0, count);
    for (const place of oldest)
      this.places.delete(place.key);
  }

  public async clear(): Promise<void> {
    this.places.clear();
    this.kept = undefined;
  }
}
