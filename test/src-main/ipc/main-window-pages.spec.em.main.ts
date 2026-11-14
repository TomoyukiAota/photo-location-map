import assert from 'assert';
import { EventEmitter } from 'events';
import type { WebContents } from 'electron';
import { appPageUrl } from '../../../src-main/file-server/app-page.js';
import { isAppPage, keepOnAppPage } from '../../../src-main/ipc/main-window-pages.js';

describe('The main window\'s pages (in main process)', () => {
  it('are the app\'s scheme and host at any route, and nothing else of an unknown scheme, whose origin is "null"', () => {
    assert.strictEqual(appPageUrl, 'plm-app://app/index.html');
    assert.strictEqual(isAppPage('plm-app://app/index.html#/settings', appPageUrl), true);
    assert.strictEqual(isAppPage('plm-app://app/chunk-ABC.js', appPageUrl), true);
    for (const url of ['plm-app://other/index.html', 'other-app://app/index.html', 'plm-photo://photo/abc',
      'file:///app/dist/index.html', 'https://example.com/', 'about:blank', 'data:text/html,a', 'not a url'])
      assert.strictEqual(isAppPage(url, appPageUrl), false, url);
  });

  it('are ng serve\'s origin for live reload, and no other origin', () => {
    assert.strictEqual(isAppPage('http://localhost:4200/#/', 'http://localhost:4200'), true);
    assert.strictEqual(isAppPage('http://localhost:4201/', 'http://localhost:4200'), false);
    assert.strictEqual(isAppPage('https://localhost:4200/', 'http://localhost:4200'), false);
  });

  it('keep the window on the app\'s page, and refuse the page a new window', () => {
    let openHandler: () => { action: string } = () => ({ action: 'allow' });
    const contents = Object.assign(new EventEmitter(), { setWindowOpenHandler: (handler: typeof openHandler) => { openHandler = handler; } });
    keepOnAppPage(contents as unknown as WebContents, appPageUrl);
    const navigate = (name: string, url: string) => {
      let prevented = false;
      contents.emit(name, { url, preventDefault: () => { prevented = true; } });
      return prevented;
    };
    assert.strictEqual(navigate('will-navigate', 'plm-app://app/index.html#/'), false);
    assert.strictEqual(navigate('will-navigate', 'https://www.openstreetmap.org/copyright'), true);
    assert.strictEqual(navigate('will-navigate', 'file:///Users/a/photo.jpg'), true);
    assert.strictEqual(navigate('will-redirect', 'https://example.com/'), true);
    assert.deepStrictEqual(openHandler(), { action: 'deny' });
  });
});
