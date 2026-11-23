import { Logger } from '../../../../src-shared/log/logger';
// The storage of the tests (test/angular/storage-double.ts), which setup.ts empties before each test.
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import type * as ConfigsModule from './raster-tile-base-layer-configs-version-1';

// Configs that a server answers with, and those that an earlier launch saved, told apart from each other and from the
// fallback configs by their maps.
const fetchedConfigs = {
  version: '1',
  rasterTileBaseLayerConfigs: [{ name: 'A Fetched Map', url: 'https://tiles.example/{z}/{x}/{y}.png' }],
};
const savedConfigs = {
  version: '1',
  rasterTileBaseLayerConfigs: [{ name: 'A Saved Map', url: 'https://saved-tiles.example/{z}/{x}/{y}.png' }],
};
const savedConfigsPath = UserDataStoragePath.LeafletMap.RasterTileBaseLayerConfigsVersion1;
const firstAddress = 'https://first.example/raster-tile-base-layer-configs-version-1.jsonc';
const lastAddress = 'https://last.example/raster-tile-base-layer-configs-version-1.jsonc';

/** A server that never answers: the request fails only when its signal aborts, as fetch() does. */
function neverAnswered(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    // Without a signal, the request is left waiting, and so is the test, which then fails on its time limit.
    init?.signal?.addEventListener('abort', () => reject(init.signal.reason));
  });
}

/** A server that answers with `body` after `milliseconds`, unless the request's signal aborts first. */
function answeredAfter(milliseconds: number, body: unknown) {
  return (_url: string, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
    const signal = init?.signal;
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    signal?.addEventListener('abort', () => reject(signal.reason));
    setTimeout(() => resolve(new Response(JSON.stringify(body))), milliseconds);
  });
}

describe('raster-tile-base-layer-configs-version-1', () => {
  let configsModule: typeof ConfigsModule;
  let fetch: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    // The module fetches the configs as it is evaluated, for the start of the page: here from a server that answers
    // at once, rather than from the network.
    vi.stubGlobal('fetch', vi.fn(answeredAfter(0, fetchedConfigs)));
    configsModule = await import('./raster-tile-base-layer-configs-version-1');
    await configsModule.initializeRasterTileBaseLayerConfigs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    vi.spyOn(Logger, 'errorNotRecorded').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts the page with the configs that the first address answers', () => {
    expect(configsModule.rasterTileBaseLayerConfigsVersion1).toEqual(fetchedConfigs);
  });

  it('goes on to the next address when one has not answered in its time, which starts with each attempt', async () => {
    // The last address answers 25 ms after its attempt starts, 75 ms after the first attempt did: within its own
    // time, but not within a time counted from the first attempt's start.
    fetch.mockImplementationOnce(neverAnswered).mockImplementationOnce(answeredAfter(25, fetchedConfigs));

    const configs = await configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([
      { url: firstAddress, timeoutMilliseconds: 50 },
      { url: lastAddress, timeoutMilliseconds: 50 },
    ]);

    expect(configs).toEqual(fetchedConfigs);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([firstAddress, lastAddress]);
    expect(Logger.errorNotRecorded).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(`Failed to fetch ${firstAddress}.`));
  });

  it('saves the configs that an address gives, and writes them again only once they have changed', async () => {
    const write = vi.spyOn(UserDataStorage, 'write');
    const fetchFrom = async (body: unknown) => {
      fetch.mockImplementation(answeredAfter(0, body));
      return configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([
        { url: firstAddress, timeoutMilliseconds: 1000 },
      ]);
    };

    expect(await fetchFrom(fetchedConfigs)).toEqual(fetchedConfigs);
    expect(JSON.parse(UserDataStorage.read(savedConfigsPath))).toEqual(fetchedConfigs);
    await fetchFrom(fetchedConfigs);
    expect(write).toHaveBeenCalledTimes(1);

    await fetchFrom(savedConfigs);
    expect(write).toHaveBeenCalledTimes(2);
    expect(JSON.parse(UserDataStorage.read(savedConfigsPath))).toEqual(savedConfigs);
  });

  it('uses the configs that an earlier launch saved when no address answers in its time', async () => {
    await UserDataStorage.write(savedConfigsPath, JSON.stringify(savedConfigs));
    fetch.mockImplementation(neverAnswered);

    const configs = await configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([
      { url: firstAddress, timeoutMilliseconds: 20 },
      { url: lastAddress, timeoutMilliseconds: 20 },
    ]);

    expect(configs).toEqual(savedConfigs);
    expect(vi.mocked(Logger.errorNotRecorded).mock.calls.map(([message]) => message)).toEqual([
      expect.stringContaining(`Failed to fetch ${firstAddress}.`),
      expect.stringContaining(`Failed to fetch ${lastAddress}.`),
      expect.stringContaining('Using the configs that an earlier launch saved.'),
    ]);
  });

  it('uses the fallback configs when no address answers in its time, and none are saved', async () => {
    fetch.mockImplementation(neverAnswered);

    const configs = await configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([
      { url: firstAddress, timeoutMilliseconds: 20 },
      { url: lastAddress, timeoutMilliseconds: 20 },
    ]);

    expect(configs).toBe(configsModule.rasterTileBaseLayerConfigsVersion1Fallback);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([firstAddress, lastAddress]);
    expect(vi.mocked(Logger.errorNotRecorded).mock.calls.map(([message]) => message)).toEqual([
      expect.stringContaining(`Failed to fetch ${firstAddress}.`),
      expect.stringContaining(`Failed to fetch ${lastAddress}.`),
      expect.stringContaining('Using the fallback configs.'),
    ]);
  });

  it('uses the fallback configs when what is saved is not valid configs', async () => {
    const notValid = [
      'not JSON',
      JSON.stringify({ version: '1', rasterTileBaseLayerConfigs: 'A Saved Map' }),
      JSON.stringify({ version: '1', rasterTileBaseLayerConfigs: [] }),
    ];
    for (const saved of notValid) {
      await UserDataStorage.write(savedConfigsPath, saved);
      fetch.mockImplementation(neverAnswered);
      vi.mocked(Logger.errorNotRecorded).mockClear();

      const configs = await configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([
        { url: firstAddress, timeoutMilliseconds: 20 },
      ]);

      expect(configs).toBe(configsModule.rasterTileBaseLayerConfigsVersion1Fallback);
      expect(vi.mocked(Logger.errorNotRecorded).mock.calls.map(([message]) => message)).toEqual([
        expect.stringContaining(`Failed to fetch ${firstAddress}.`),
        expect.stringContaining('The saved configs are not valid configs, and are not used.'),
        expect.stringContaining('Using the fallback configs.'),
      ]);
    }
  });

  it('reads the names of the layers of the app\'s own that the configs hide, and hides none without a list of them', () => {
    const { hiddenBuiltInBaseLayersOf, rasterTileBaseLayerConfigsVersion1Fallback } = configsModule;
    const hidden = (field: unknown) =>
      [...hiddenBuiltInBaseLayersOf({ ...fetchedConfigs, hiddenBuiltInBaseLayers: field as string[] })];
    const wayback = 'Esri World Imagery Wayback';
    // A layer that this release does not have, as one of a later release: its name hides nothing here.
    const laterLayer = 'A layer of a later release';

    expect(hidden([wayback, laterLayer])).toEqual([wayback, laterLayer]);
    expect(hidden([laterLayer, 1, null, { name: wayback }])).toEqual([laterLayer]);
    expect(hidden([])).toEqual([]);
    expect(hidden(wayback)).toEqual([]);
    expect(hidden({ [wayback]: true })).toEqual([]);
    expect(hidden(null)).toEqual([]);
    expect([...hiddenBuiltInBaseLayersOf(fetchedConfigs)]).toEqual([]);
    expect([...hiddenBuiltInBaseLayersOf(rasterTileBaseLayerConfigsVersion1Fallback)]).toEqual([]);
  });

  it('hides what the configs that it saved hide, at a launch whose addresses do not answer', async () => {
    const hiding = { ...fetchedConfigs, hiddenBuiltInBaseLayers: ['Esri World Imagery Wayback'] };
    fetch.mockImplementationOnce(answeredAfter(0, hiding)).mockImplementationOnce(neverAnswered);
    await configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([{ url: firstAddress, timeoutMilliseconds: 1000 }]);

    const configs = await configsModule.fetchRasterTileBaseLayerConfigsVersion1WithRetry([
      { url: firstAddress, timeoutMilliseconds: 20 },
    ]);

    expect(configs).toEqual(hiding);
    expect([...configsModule.hiddenBuiltInBaseLayersOf(configs)]).toEqual(['Esri World Imagery Wayback']);
  });

  it('gives each address that the start tries a time limit, 20 seconds in all', () => {
    // Within the 30 seconds that the e2e suite waits for the home view (test/e2e/regression.spec.mjs), so that a
    // launch whose hosts do not answer starts with the fallback configs there, rather than failing.
    const limits = configsModule.configsFileFetchAttempts.map(attempt => attempt.timeoutMilliseconds);
    expect(limits.length).toBeGreaterThan(0);
    expect(limits.every(limit => Number.isFinite(limit) && limit > 0)).toBe(true);
    expect(limits.reduce((sum, limit) => sum + limit, 0)).toBeLessThanOrEqual(20000);
  });
});
