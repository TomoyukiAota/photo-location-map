import assert from 'assert';
import { EventEmitter } from 'events';
import type { WebContents } from 'electron';
import { isAppPage, keepOnAppPage } from '../../../src-main/ipc/main-window-pages.js';

describe('The main window\'s pages (in main process)', () => {
  it('are the app\'s file at any route, however its path is escaped, as Node.js and Chromium escape differently', () => {
    const page = 'file:///Users/a%20b/%E5%86%99%E7%9C%9F/app/dist/index.html';
    assert.strictEqual(isAppPage('file:///Users/a%20b/写真/app/dist/index.html#/settings', page), true);
    assert.strictEqual(isAppPage('file:///C:/Program%20Files/app^1/dist/index.html', 'file:///C:/Program%20Files/app%5E1/dist/index.html'), true);
    assert.strictEqual(isAppPage('file:///c:/program%20files/app%5E1/dist/index.html', 'file:///C:/Program%20Files/app%5E1/dist/index.html'),
      process.platform === 'win32');
    for (const url of ['file:///Users/a%20b/app/docs/index.html', 'https://example.com/', 'about:blank', 'not a url'])
      assert.strictEqual(isAppPage(url, page), false, url);
  });

  it('are ng serve\'s origin for live reload, and no other origin', () => {
    assert.strictEqual(isAppPage('http://localhost:4200/#/', 'http://localhost:4200'), true);
    assert.strictEqual(isAppPage('http://localhost:4201/', 'http://localhost:4200'), false);
    assert.strictEqual(isAppPage('https://localhost:4200/', 'http://localhost:4200'), false);
  });

  it('keep the window on the app\'s page, and refuse the page a new window', () => {
    let openHandler: () => { action: string } = () => ({ action: 'allow' });
    const contents = Object.assign(new EventEmitter(), { setWindowOpenHandler: (handler: typeof openHandler) => { openHandler = handler; } });
    keepOnAppPage(contents as unknown as WebContents, 'file:///app/dist/index.html');
    const navigate = (name: string, url: string) => {
      let prevented = false;
      contents.emit(name, { url, preventDefault: () => { prevented = true; } });
      return prevented;
    };
    assert.strictEqual(navigate('will-navigate', 'file:///app/dist/index.html#/'), false);
    assert.strictEqual(navigate('will-navigate', 'https://www.openstreetmap.org/copyright'), true);
    assert.strictEqual(navigate('will-navigate', 'file:///Users/a/photo.jpg'), true);
    assert.strictEqual(navigate('will-redirect', 'https://example.com/'), true);
    assert.deepStrictEqual(openHandler(), { action: 'deny' });
  });
});
