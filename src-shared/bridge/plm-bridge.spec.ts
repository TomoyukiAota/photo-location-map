import { bridge, bridgeReadyEvent, plmBridge, whenBridgeReady } from './plm-bridge.js';

describe('The page\'s bridge to the main process', () => {
  let doubleOfPreload: typeof window.plm;
  beforeEach(() => { doubleOfPreload = window.plm; });
  afterEach(() => { window.plm = doubleOfPreload; });

  it('is the preload\'s window.plm', () => {
    expect(plmBridge()).toBe(window.plm);
    expect(bridge()).toBe(window.plm);
    window.plm = undefined;
    expect(plmBridge()).toBeUndefined();
    expect(() => bridge()).toThrow('This page has no bridge to the main process');
  });

  it('is ready at once when the preload ran before the page', async () => {
    await expect(whenBridgeReady()).resolves.toBeUndefined();
  });

  it('is waited for until the preload, run after the page, says it is there', async () => {
    window.plm = undefined;
    let ready = false;
    const waiting = whenBridgeReady().then(() => { ready = true; });
    await Promise.resolve();
    expect(ready).toBe(false);
    window.plm = doubleOfPreload;
    window.dispatchEvent(new Event(bridgeReadyEvent));
    await waiting;
    expect(ready).toBe(true);
  });
});
