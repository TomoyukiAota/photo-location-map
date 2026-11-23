import { inject, InjectionToken, Service } from '@angular/core';
import { leafletMapLogger as logger } from '../leaflet-map-logger';
import type { KnownVersions, WaybackRelease, WaybackVersion } from './wayback';

/** The most places whose versions WaybackDateCache keeps, 0.3 to 1 KB each for their 12 to 40 versions. */
export const maxCachedPlaces = 100_000;

/** How long the list of Wayback's releases is used before it is fetched again: Esri publishes one every few weeks. */
export const cachedReleasesLifetimeMs = 24 * 60 * 60 * 1000;

/** The versions at a place, as WaybackDateCache keeps them. */
export interface CachedPlace {
  /** The key of the place in MapDateService: its zoom, and the sixteenth of the map's tile. */
  readonly key: string;
  /** The number of the newest release when the versions were looked up. */
  readonly newestRelease: number;
  /** For each version, newest first: the number of its release, and when its imagery was taken, or null. */
  readonly versions: ReadonlyArray<readonly [number, string | null]>;
  /** When the place was last looked at, in milliseconds since 1970. */
  readonly seenAt: number;
}

/** The list of Wayback's releases, as WaybackDateCache keeps it. */
export interface CachedReleases {
  readonly releases: readonly WaybackRelease[];
  /** When it was fetched, in milliseconds since 1970. */
  readonly fetchedAt: number;
}

/** Where WaybackDateCache keeps what it keeps: IndexedDB, or a double in the unit tests. */
export interface WaybackDateStore {
  releases(): Promise<CachedReleases | undefined>;
  saveReleases(releases: CachedReleases): Promise<void>;
  place(key: string): Promise<CachedPlace | undefined>;
  savePlace(place: CachedPlace): Promise<void>;
  /** How many places are kept. */
  count(): Promise<number>;
  /** Removes the `count` places that were looked at longest ago. */
  removeOldest(count: number): Promise<void>;
  /** Removes every place, and the list of the releases. */
  clear(): Promise<void>;
}

/** Opens the store of WaybackDateCache, or gives null where there is no IndexedDB, as in the unit tests' jsdom. */
export const openWaybackDateStore = new InjectionToken<() => Promise<WaybackDateStore | null>>('openWaybackDateStore', {
  factory: () => openIndexedDbWaybackDateStore,
});

/** What WaybackDateCache keeps of a place: whether it keeps the place, and its versions if they fit the releases. */
export interface KeptPlace {
  readonly kept: boolean;
  readonly known?: KnownVersions;
}

/**
 * What Wayback answered, kept on the computer, so that a place looked at before shows when its imagery was taken at
 * once, after a restart too: the list of the releases for a day, and the versions at up to `maxPlaces` places, those
 * looked at longest ago going first.
 * TL;DR: In the page's IndexedDB. What a release answers never changes, so the versions kept at a place stay right as
 * Esri publishes releases: MapDateService asks about the newer releases only (versionsAt() in wayback.ts).
 * Details:
 * - Not in the folder of the cache of the thumbnails, which the app empties at its start of what is not the thumbnail
 *   of a photo that is there (removeInvalidThumbnailCache()).
 * - The places are counted when the store is first used, and counted on as they are added; those looked at longest
 *   ago are removed while there are more than `maxPlaces`.
 * - Where the store fails, as when the disk is full, the cache logs it and keeps nothing more until a restart: the map
 *   asks Wayback as it does without the cache.
 */
@Service()
export class WaybackDateCache {
  /** The most places kept: `maxCachedPlaces`, unless a test keeps fewer. */
  public maxPlaces = maxCachedPlaces;
  private readonly open = inject(openWaybackDateStore);
  private store: Promise<WaybackDateStore | null> | null = null;
  private placeCount = 0;

  /** The list of the releases, if it was fetched less than `cachedReleasesLifetimeMs` ago. */
  public async releases(now = Date.now()): Promise<WaybackRelease[] | undefined> {
    const cached = await this.use(store => store.releases());
    if (!cached || !(cached.fetchedAt <= now && now - cached.fetchedAt < cachedReleasesLifetimeMs))
      return undefined;
    return [...cached.releases];
  }

  public async saveReleases(releases: readonly WaybackRelease[], now = Date.now()): Promise<void> {
    await this.use(store => store.saveReleases({ releases, fetchedAt: now }));
  }

  /**
   * What is kept of the place of `key`: its versions, by the releases of `releases`, unless one of them is no longer
   * in the list.
   */
  public async place(key: string, releases: readonly WaybackRelease[]): Promise<KeptPlace> {
    const cached = await this.use(store => store.place(key));
    if (!cached)
      return { kept: false };
    const byNumber = new Map(releases.map(release => [release.number, release]));
    if (!byNumber.has(cached.newestRelease))
      return { kept: true };
    const versions: WaybackVersion[] = [];
    for (const [number, captureDate] of cached.versions) {
      const release = byNumber.get(number);
      if (!release)
        return { kept: true };
      versions.push({ release, captureDate });
    }
    return { kept: true, known: { newestRelease: cached.newestRelease, versions } };
  }

  /** Keeps the versions at the place of `key`, looked at `now`, which `kept` tells whether it was kept before. */
  public async savePlace(key: string, newestRelease: number, versions: readonly WaybackVersion[], kept: boolean,
                         now = Date.now()): Promise<void> {
    await this.use(async store => {
      await store.savePlace({
        key,
        newestRelease,
        versions: versions.map(version => [version.release.number, version.captureDate] as const),
        seenAt: now,
      });
      if (kept)
        return;
      this.placeCount++;
      await this.removeOldestBeyondMax(store);
    });
  }

  /** How many places are kept. */
  public async count(): Promise<number> {
    return (await this.use(async () => this.placeCount)) ?? 0;
  }

  /** Forgets every place and the list of the releases. */
  public async clear(): Promise<void> {
    await this.use(async store => {
      await store.clear();
      this.placeCount = 0;
    });
  }

  /** Runs `action` with the store, or does nothing where there is none, or it has failed. */
  private async use<T>(action: (store: WaybackDateStore) => Promise<T>): Promise<T | undefined> {
    this.store ??= this.open()
      .then(async store => {
        if (store) {
          this.placeCount = await store.count();
          await this.removeOldestBeyondMax(store);
        }
        return store;
      })
      .catch(error => this.failed(error));
    const store = await this.store;
    if (!store)
      return undefined;
    try {
      return await action(store);
    } catch (error) {
      await this.failed(error);
      return undefined;
    }
  }

  private async removeOldestBeyondMax(store: WaybackDateStore): Promise<void> {
    if (this.placeCount <= this.maxPlaces)
      return;
    await store.removeOldest(this.placeCount - this.maxPlaces);
    this.placeCount = this.maxPlaces;
  }

  private async failed(error: unknown): Promise<null> {
    logger.errorNotRecorded('Failed to use the cache of the dates of Wayback\'s imagery, which keeps nothing more until a restart', error);
    this.store = Promise.resolve(null);
    return null;
  }
}

const databaseName = 'plm-wayback-dates';
const placeStore = 'places';
const releaseStore = 'releases';
/** The key of the list of the releases, the only entry of its store. */
const releaseKey = 'list';

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function completion(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** The store of WaybackDateCache in the page's IndexedDB, or null where the page has no IndexedDB. */
async function openIndexedDbWaybackDateStore(): Promise<WaybackDateStore | null> {
  if (typeof indexedDB === 'undefined')
    return null;
  const opening = indexedDB.open(databaseName, 1);
  opening.onupgradeneeded = () => {
    const database = opening.result;
    database.createObjectStore(placeStore, { keyPath: 'key' }).createIndex('seenAt', 'seenAt');
    database.createObjectStore(releaseStore);
  };
  const database = await result(opening);
  const write = async (stores: string[], action: (transaction: IDBTransaction) => void) => {
    const transaction = database.transaction(stores, 'readwrite');
    action(transaction);
    await completion(transaction);
  };
  return {
    releases: () => result(database.transaction(releaseStore).objectStore(releaseStore).get(releaseKey)),
    saveReleases: releases => write([releaseStore], transaction => transaction.objectStore(releaseStore).put(releases, releaseKey)),
    place: key => result(database.transaction(placeStore).objectStore(placeStore).get(key)),
    savePlace: place => write([placeStore], transaction => transaction.objectStore(placeStore).put(place)),
    count: () => result(database.transaction(placeStore).objectStore(placeStore).count()),
    removeOldest: count => write([placeStore], transaction => {
      let left = count;
      const cursor = transaction.objectStore(placeStore).index('seenAt').openCursor();
      cursor.onsuccess = () => {
        if (!cursor.result || left <= 0)
          return;
        cursor.result.delete();
        left--;
        cursor.result.continue();
      };
    }),
    clear: () => write([placeStore, releaseStore], transaction => {
      transaction.objectStore(placeStore).clear();
      transaction.objectStore(releaseStore).clear();
    }),
  };
}
