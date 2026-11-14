import assert from 'assert';
import { EventEmitter } from 'events';
import { loadViewerPage, ViewerWindow } from '../../../src-main/photo-data-viewer/load-viewer-page.js';

describe('loadViewerPage (in main process)', () => {
  /** A stand-in for the viewer's window, whose load the test settles, and which records what is done to it. */
  function setUp() {
    let settle: { resolve: () => void, reject: (error: Error) => void };
    const window = Object.assign(new EventEmitter(), {
      destroyed: false,
      shown: 0,
      loadedUrls: [] as string[],
      loadURL(url: string) {
        window.loadedUrls.push(url);
        return new Promise<void>((resolve, reject) => { settle = { resolve, reject }; });
      },
      isDestroyed: () => window.destroyed,
      show: () => { window.shown++; },
    });
    return { window, viewerWindow: window as unknown as ViewerWindow, settle: () => settle };
  }

  const url = 'https://viewer.example/?language=en';
  const stoppedByClosing = Object.assign(new Error(`ERR_FAILED (-2) loading '${url}'`), { code: 'ERR_FAILED', errno: -2 });

  it('shows the window once its page has loaded', async () => {
    const { window, viewerWindow, settle } = setUp();

    const loading = loadViewerPage(viewerWindow, url, true);
    assert.equal(window.shown, 0);
    settle().resolve();
    await loading;

    assert.deepEqual(window.loadedUrls, [url]);
    assert.equal(window.shown, 1);
  });

  it('leaves the window hidden when it is not to be shown, as in a headless test', async () => {
    const { window, viewerWindow, settle } = setUp();

    const loading = loadViewerPage(viewerWindow, url, false);
    settle().resolve();
    await loading;

    assert.equal(window.shown, 0);
  });

  it('takes a load that closing the window stopped as no failure, and does not show the window', async () => {
    const { window, viewerWindow, settle } = setUp();

    const loading = loadViewerPage(viewerWindow, url, true);
    window.emit('close');
    settle().reject(stoppedByClosing);

    await assert.doesNotReject(loading);
    assert.equal(window.shown, 0);
  });

  it('takes a load that a destroyed window stopped as no failure, without a close event', async () => {
    const { window, viewerWindow, settle } = setUp();

    const loading = loadViewerPage(viewerWindow, url, true);
    window.destroyed = true;
    settle().reject(stoppedByClosing);

    await assert.doesNotReject(loading);
    assert.equal(window.shown, 0);
  });

  it('rejects with the error of a page that does not load in a window that stays open', async () => {
    const { window, viewerWindow, settle } = setUp();
    const notFound = Object.assign(new Error(`ERR_NAME_NOT_RESOLVED (-105) loading '${url}'`), { code: 'ERR_NAME_NOT_RESOLVED' });

    const loading = loadViewerPage(viewerWindow, url, true);
    settle().reject(notFound);

    await assert.rejects(loading, error => error === notFound);
    assert.equal(window.shown, 0);
  });

  it('does not show a window that was closed after its page loaded', async () => {
    const { window, viewerWindow, settle } = setUp();

    const loading = loadViewerPage(viewerWindow, url, true);
    settle().resolve();
    window.destroyed = true;
    await loading;

    assert.equal(window.shown, 0);
  });
});
