import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { respondToAppPageRequest } from '../../../src-main/file-server/app-page.js';
import { mainWindowContentSecurityPolicy } from '../../../src-main/file-server/content-security-policy.js';

describe('The app\'s page (in main process)', () => {
  let root: string;
  let dist: string;
  /** A build whose page has nowhere to write its language. */
  let plainDist: string;
  const page = (lang: string, dir: string, text: string) => `<!doctype html><html lang="${lang}" dir="${dir}"><title>app</title>`
    + `<span class="app-loading-text" id="app-loading-text">${text}</span></html>`;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-app-page-'));
    dist = path.join(root, 'dist');
    fs.mkdirSync(path.join(dist, 'media'), { recursive: true });
    fs.writeFileSync(path.join(dist, 'index.html'), page('en', 'ltr', 'Loading...'));
    fs.writeFileSync(path.join(dist, 'main-ABC.js'), 'export const app = 1;');
    fs.writeFileSync(path.join(dist, 'media', '写真 #1.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    fs.writeFileSync(path.join(root, 'secret.txt'), 'not of the page');
    plainDist = path.join(root, 'plain-dist');
    fs.mkdirSync(plainDist);
    fs.writeFileSync(path.join(plainDist, 'index.html'), '<!doctype html><title>app</title>');
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  /** The answer to a request of the page, as protocol.handle gives it, with only what the handler reads. */
  const respond = (url: string, method = 'GET') => respondToAppPageRequest({ url, method } as Request, dist, 'en');

  it('answers a file of the build, with the type of its extension', async () => {
    const index = await respond('plm-app://app/index.html');
    assert.strictEqual(index.status, 200);
    assert.strictEqual(await index.text(), page('en', 'ltr', 'Loading...'));
    assert.match(index.headers.get('content-type') ?? '', /^text\/html/);

    const script = await respond('plm-app://app/main-ABC.js');
    assert.strictEqual(script.status, 200);
    assert.strictEqual(await script.text(), 'export const app = 1;');
    assert.match(script.headers.get('content-type') ?? '', /javascript/);

    const media = await respond(`plm-app://app/media/${encodeURIComponent('写真 #1.svg')}`);
    assert.strictEqual(media.status, 200);
    assert.match(media.headers.get('content-type') ?? '', /^image\/svg\+xml/);
  });

  it('answers each file with the page\'s Content Security Policy', async () => {
    for (const url of ['plm-app://app/index.html', 'plm-app://app/main-ABC.js', `plm-app://app/media/${encodeURIComponent('写真 #1.svg')}`]) {
      const answer = await respond(url);
      assert.strictEqual(answer.headers.get('content-security-policy'), mainWindowContentSecurityPolicy, url);
      // The answer is the file, whole, with its other headers.
      assert.ok(answer.headers.get('content-type'), url);
      assert.ok((await answer.arrayBuffer()).byteLength > 0, url);
    }
  });

  // TL;DR: protocol.handle has the network service send the file of an answer that is still net.fetch's, as
  // app-page.ts says, and streams any other through JavaScript.
  // Details: These are the conditions of relayUntouchedFetch in Electron's lib/browser/api/protocol.ts, which reads
  // the __fetch that net.fetch puts on its answer. After an upgrade of Electron that fails here, look again at how
  // protocol.handle answers.
  it('answers with the Response of net.fetch itself, unread, which protocol.handle relays without JavaScript', async () => {
    const answer = await respond('plm-app://app/main-ABC.js') as Response & { __fetch?: { body: unknown } };
    assert.ok(answer.__fetch, 'The answer is not the Response of net.fetch.');
    assert.strictEqual(answer.body, answer.__fetch.body);
    assert.strictEqual(answer.bodyUsed, false);
    assert.strictEqual(answer.body?.locked, false);
  });

  it('answers the page in the application\'s language, with its direction and its loading text in it', async () => {
    const japanese = await respondToAppPageRequest({ url: 'plm-app://app/index.html', method: 'GET' } as Request, dist, 'ja');
    assert.strictEqual(await japanese.text(), page('ja', 'ltr', '読み込み中...'));
    assert.match(japanese.headers.get('content-type') ?? '', /^text\/html; charset=utf-8$/);
    assert.strictEqual(japanese.headers.get('content-security-policy'), mainWindowContentSecurityPolicy);

    const arabic = await respondToAppPageRequest({ url: 'plm-app://app/index.html', method: 'GET' } as Request, dist, 'ar');
    assert.strictEqual(await arabic.text(), page('ar', 'rtl', 'جارٍ التحميل...'));
  });

  it('answers a page that has nowhere to write its language as it is, with the policy', async () => {
    const answer = await respondToAppPageRequest({ url: 'plm-app://app/index.html', method: 'GET' } as Request, plainDist, 'ja');
    assert.strictEqual(answer.status, 200);
    assert.strictEqual(await answer.text(), '<!doctype html><title>app</title>');
    assert.strictEqual(answer.headers.get('content-security-policy'), mainWindowContentSecurityPolicy);
  });

  it('answers nothing outside the build, of another host, or that is not a file', async () => {
    for (const url of [
      'plm-app://app/%2E%2E/secret.txt',
      'plm-app://app/..%2Fsecret.txt',
      'plm-app://app/..%5Csecret.txt',
      'plm-app://other/index.html',
      'plm-app://app/',
      'plm-app://app/media',
      'plm-app://app/missing.js',
      'plm-app://app/%E0%A4%A',
    ])
      assert.strictEqual((await respond(url)).status, 404, url);
  });

  it('only reads', async () => {
    assert.strictEqual((await respond('plm-app://app/index.html', 'POST')).status, 405);
  });
});
