import assert from 'assert';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { app, protocol, type WebContents } from 'electron';
import { grantPhoto, isViewerPage, keepOnViewerPages, photoFor, photoMimeType, respondToPhotoRequest } from '../../../src-main/photo-data-viewer/photo-delivery.js';
import { getPhotoDataViewerServerUrl } from '../../../src-main/photo-data-viewer/photo-data-viewer-server-config.js';

// A stand-in for the web contents of a window of Photo Data Viewer: its events are emitted by the test.
class Contents extends EventEmitter {
  private destroyed = false;
  public isDestroyed() { return this.destroyed; }
  public destroy() { this.destroyed = true; this.emit('destroyed'); }
}
const asWebContents = (contents: Contents) => contents as unknown as WebContents;
const viewerOrigin = new URL(getPhotoDataViewerServerUrl()).origin;
const navigate = (contents: Contents, url: string, details: Partial<{ isMainFrame: boolean, isSameDocument: boolean }> = {}) =>
  contents.emit('did-start-navigation', { url, isMainFrame: true, isSameDocument: false, ...details });
// What protocol.handle passes for the viewer's fetch(): the URL, the mode and the referrer, which Chromium sets from the
// page. It passes no Origin header.
const request = (url: string, referrer = `${viewerOrigin}/`, mode: RequestMode = 'cors') =>
  ({ url, referrer, mode, headers: new Headers() }) as unknown as Request;

describe('The photo of Photo Data Viewer\'s window (in main process)', () => {
  let root: string;
  let photo: { name: string, path: string };
  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-photo-delivery-'));
    photo = { name: '写真 # 50%.JPG', path: path.join(root, '写真 # 50%.JPG') };
    fs.writeFileSync(photo.path, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]));
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('has the MIME type that mime-types gave the viewer for the extension, or none', () => {
    for (const [name, type] of [['a.jpg', 'image/jpeg'], ['A.JPEG', 'image/jpeg'], ['a.jpe', 'image/jpeg'], ['a.HEIC', 'image/heic'],
      ['a.heif', 'image/heif'], ['a.png', 'image/png'], ['a.tif', 'image/tiff'], ['a.TIFF', 'image/tiff'], ['a.webp', 'image/webp'],
      ['a.jfif', ''], ['a', ''], ['a.mov', '']])
      assert.strictEqual(photoMimeType(name), type, name);
  });

  it('gives the window\'s page a URL that only the viewer\'s origin can read the photo from', async () => {
    const contents = new Contents();
    grantPhoto(asWebContents(contents), photo);
    const given = await photoFor(asWebContents(contents), 'url');
    assert.deepStrictEqual({ name: given.name, type: given.type }, { name: photo.name, type: 'image/jpeg' });
    assert.ok('url' in given && /^plm-photo:\/\/photo\/[0-9a-f]{64}$/.test(given.url), JSON.stringify(given));
    if (!('url' in given)) return;
    const answer = await respondToPhotoRequest(request(given.url));
    assert.strictEqual(answer.status, 200);
    assert.strictEqual(answer.headers.get('access-control-allow-origin'), viewerOrigin);
    assert.strictEqual(answer.headers.get('content-type'), 'image/jpeg');
    assert.deepStrictEqual(Buffer.from(await answer.arrayBuffer()), fs.readFileSync(photo.path));
    // Another page, one that sends no referrer, and a request that Chromium's CORS check would not cover.
    assert.strictEqual((await respondToPhotoRequest(request(given.url, 'https://example.com/'))).status, 403);
    assert.strictEqual((await respondToPhotoRequest(request(given.url, ''))).status, 403);
    assert.strictEqual((await respondToPhotoRequest(request(given.url, `${viewerOrigin}/`, 'no-cors'))).status, 403);
    const anotherToken = given.url.slice(0, -1) + (given.url.endsWith('0') ? '1' : '0');
    assert.strictEqual((await respondToPhotoRequest(request(anotherToken))).status, 404);
    contents.destroy();
  });

  it('reads the photo past the app\'s own handler of file: URLs, and answers 404 when the photo is gone', async () => {
    // The app's handler (src-main/electron-main.ts) cannot read a path with "#" in it, as the photo's here has.
    await app.whenReady();
    protocol.handle('file', () => new Response(null, { status: 500 }));
    try {
      const contents = new Contents();
      const gone = { name: 'gone # 1.jpg', path: path.join(root, 'gone # 1.jpg') };
      grantPhoto(asWebContents(contents), photo);
      const given = await photoFor(asWebContents(contents), 'url');
      if (!('url' in given)) throw new Error('No URL');
      const answer = await respondToPhotoRequest(request(given.url));
      assert.strictEqual(answer.status, 200);
      assert.deepStrictEqual(Buffer.from(await answer.arrayBuffer()), fs.readFileSync(photo.path));
      grantPhoto(asWebContents(contents), gone);
      const missing = await photoFor(asWebContents(contents), 'url');
      if ('url' in missing) assert.strictEqual((await respondToPhotoRequest(request(missing.url))).status, 404);
      contents.destroy();
    } finally {
      protocol.unhandle('file');
    }
  });

  it('gives the bytes instead with the ipc transport', async () => {
    const contents = new Contents();
    grantPhoto(asWebContents(contents), photo);
    const given = await photoFor(asWebContents(contents), 'ipc');
    assert.ok('bytes' in given);
    if ('bytes' in given) assert.deepStrictEqual(Buffer.from(given.bytes), fs.readFileSync(photo.path));
    contents.destroy();
  });

  it('keeps the photo for a reload of the viewer, and revokes it for another origin, a closed window or a crash', async () => {
    for (const end of ['another origin', 'closed', 'crashed'] as const) {
      const contents = new Contents();
      grantPhoto(asWebContents(contents), photo);
      const given = await photoFor(asWebContents(contents), 'url');
      navigate(contents, `${viewerOrigin}/?plmBridge=1`);
      navigate(contents, 'https://example.com/', { isMainFrame: false });
      navigate(contents, `https://example.com/#same`, { isSameDocument: true });
      assert.strictEqual((await photoFor(asWebContents(contents), 'url')).name, photo.name, end);
      if (end === 'another origin') navigate(contents, 'https://example.com/');
      if (end === 'closed') contents.destroy();
      if (end === 'crashed') contents.emit('render-process-gone');
      await assert.rejects(photoFor(asWebContents(contents), 'url'), /no photo/, end);
      if ('url' in given) assert.strictEqual((await respondToPhotoRequest(request(given.url))).status, 404, end);
    }
  });

  it('gives each window its own photo', async () => {
    const [first, second] = [new Contents(), new Contents()];
    const other = { name: 'other.heic', path: path.join(root, 'other.heic') };
    fs.writeFileSync(other.path, 'heic');
    grantPhoto(asWebContents(first), photo);
    grantPhoto(asWebContents(second), other);
    const [one, two] = [await photoFor(asWebContents(first), 'url'), await photoFor(asWebContents(second), 'url')];
    assert.deepStrictEqual([one.name, two.name, two.type], [photo.name, 'other.heic', 'image/heic']);
    assert.notStrictEqual('url' in one && one.url, 'url' in two && two.url);
    first.destroy();
    assert.strictEqual((await photoFor(asWebContents(second), 'url')).name, 'other.heic');
    second.destroy();
  });

  it('keeps the window on the viewer\'s origin', () => {
    const contents = new Contents();
    keepOnViewerPages(asWebContents(contents));
    const navigate = (name: string, url: string) => {
      let prevented = false;
      contents.emit(name, { url, preventDefault: () => { prevented = true; } });
      return prevented;
    };
    assert.strictEqual(navigate('will-navigate', `${viewerOrigin}/?plmBridge=1`), false);
    assert.strictEqual(navigate('will-navigate', 'https://example.com/'), true);
    assert.strictEqual(navigate('will-navigate', 'file:///Users/a/photo.jpg'), true);
    assert.strictEqual(navigate('will-redirect', 'https://example.com/'), true);
  });

  it('takes the viewer\'s origin as its page', () => {
    assert.strictEqual(isViewerPage(`${viewerOrigin}/?plmBridge=1`), true);
    for (const url of ['https://example.com/', 'file:///index.html', '', undefined, 'not a url'])
      assert.strictEqual(isViewerPage(url), false, String(url));
  });
});
