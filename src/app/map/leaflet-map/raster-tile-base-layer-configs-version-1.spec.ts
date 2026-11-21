import { Logger } from '../../../../src-shared/log/logger';
import type * as ConfigsModule from './raster-tile-base-layer-configs-version-1';

// Configs that a server answers with, told apart from the fallback configs by their map.
const fetchedConfigs = {
  version: '1',
  rasterTileBaseLayerConfigs: [{ name: 'A Fetched Map', url: 'https://tiles.example/{z}/{x}/{y}.png' }],
};
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

  it('uses the fallback configs when no address answers in its time', async () => {
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

  it('gives each address that the start tries a time limit, 20 seconds in all', () => {
    // Within the 30 seconds that the e2e suite waits for the home view (test/e2e/regression.spec.mjs), so that a
    // launch whose hosts do not answer starts with the fallback configs there, rather than failing.
    const limits = configsModule.configsFileFetchAttempts.map(attempt => attempt.timeoutMilliseconds);
    expect(limits.length).toBeGreaterThan(0);
    expect(limits.every(limit => Number.isFinite(limit) && limit > 0)).toBe(true);
    expect(limits.reduce((sum, limit) => sum + limit, 0)).toBeLessThanOrEqual(20000);
  });
});
