import { TestBed } from '@angular/core/testing';
import { WaybackDateStoreDouble } from '../../../../../test/angular/wayback-date-store-double';
import { waybackUrls } from '../../../../../src-shared/map/dated-layer-urls';
import type { WaybackRelease, WaybackVersion } from './wayback';
import { cachedReleasesLifetimeMs, openWaybackDateStore, WaybackDateCache, WaybackDateStore } from './wayback-date-cache';

const release = (number: number, date: string): WaybackRelease =>
  ({ number, date, metadataUrl: `${waybackUrls.metadata}World_Imagery_Metadata_${number}/MapServer` });
const releases = [release(3692, '2026-11-18'), release(49059, '2026-04-30'), release(49999, '2025-07-31')];

describe('WaybackDateCache', () => {
  let store: WaybackDateStoreDouble;

  /** The cache, with `opened` as what its store opens to. */
  function cacheWith(opened: () => Promise<WaybackDateStore | null> = async () => store): WaybackDateCache {
    TestBed.configureTestingModule({ providers: [{ provide: openWaybackDateStore, useValue: opened }] });
    return TestBed.inject(WaybackDateCache);
  }

  beforeEach(() => {
    store = new WaybackDateStoreDouble();
  });

  it('keeps the versions at a place, and gives them back by the releases of the list, unless one has gone from it', async () => {
    const cache = cacheWith();
    const versions: WaybackVersion[] = [{ release: releases[1], captureDate: '2025-11-27' }, { release: releases[2], captureDate: null }];

    expect(await cache.place('17/459311/208290', releases)).toEqual({ kept: false });
    await cache.savePlace('17/459311/208290', 3692, versions, false, 1000);

    expect(store.places.get('17/459311/208290')).toEqual(
      { key: '17/459311/208290', newestRelease: 3692, versions: [[49059, '2025-11-27'], [49999, null]], seenAt: 1000 });
    expect(await cache.place('17/459311/208290', releases)).toEqual({ kept: true, known: { newestRelease: 3692, versions } });
    // Esri took a release away: what is kept is asked again.
    expect(await cache.place('17/459311/208290', releases.slice(0, 2))).toEqual({ kept: true });
    expect(await cache.place('17/459311/208290', releases.slice(1))).toEqual({ kept: true });
    expect(await cache.count()).toBe(1);
  });

  it('keeps the list of the releases for a day', async () => {
    const cache = cacheWith();

    await cache.saveReleases(releases, 0);

    expect(await cache.releases(cachedReleasesLifetimeMs - 1)).toEqual(releases);
    expect(await cache.releases(cachedReleasesLifetimeMs)).toBeUndefined();
    // Fetched later than now, as after the computer's clock was turned back.
    expect(await cache.releases(-1)).toBeUndefined();
  });

  it('removes the places looked at longest ago beyond its most, when it opens and as it keeps more', async () => {
    for (const [key, seenAt] of [['a', 3], ['b', 1], ['c', 2]] as const)
      store.places.set(key, { key, newestRelease: 3692, versions: [], seenAt });
    const cache = cacheWith();
    cache.maxPlaces = 2;

    expect(await cache.count()).toBe(2);
    expect([...store.places.keys()].sort()).toEqual(['a', 'c']);
    await cache.savePlace('d', 3692, [], false, 4);
    expect([...store.places.keys()].sort()).toEqual(['a', 'd']);
    // A place kept before is not counted again.
    await cache.savePlace('a', 3692, [], true, 5);
    expect(await cache.count()).toBe(2);
    expect([...store.places.keys()].sort()).toEqual(['a', 'd']);
  });

  it('forgets every place and the list of the releases', async () => {
    const cache = cacheWith();
    await cache.saveReleases(releases, Date.now());
    await cache.savePlace('a', 3692, [], false);

    await cache.clear();

    expect(await cache.count()).toBe(0);
    expect(store.places.size).toBe(0);
    expect(await cache.releases()).toBeUndefined();
  });

  it('keeps nothing where there is no store, nor once the store has failed', async () => {
    const none = cacheWith(async () => null);
    await none.savePlace('a', 3692, [], false);
    expect(await none.place('a', releases)).toEqual({ kept: false });
    expect(await none.count()).toBe(0);

    TestBed.resetTestingModule();
    const failing = cacheWith();
    store.places.set('a', { key: 'a', newestRelease: 3692, versions: [], seenAt: 1 });
    store.savePlace = async () => {
      throw new Error('The disk is full.');
    };
    await failing.savePlace('b', 3692, [], false);
    expect(await failing.place('a', releases)).toEqual({ kept: false });
    expect(await failing.count()).toBe(0);
  });
});
