import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { respondToAppPageRequest } from '../../../src-main/file-server/app-page.js';

describe('The app\'s page (in main process)', () => {
  let root: string;
  let dist: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-app-page-'));
    dist = path.join(root, 'dist');
    fs.mkdirSync(path.join(dist, 'media'), { recursive: true });
    fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>app</title>');
    fs.writeFileSync(path.join(dist, 'main-ABC.js'), 'export const app = 1;');
    fs.writeFileSync(path.join(dist, 'media', '写真 #1.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    fs.writeFileSync(path.join(root, 'secret.txt'), 'not of the page');
  });

  after(() => fs.rmSync(root, { recursive: true, force: true }));

  /** The answer to a request of the page, as protocol.handle gives it, with only what the handler reads. */
  const respond = (url: string, method = 'GET') => respondToAppPageRequest({ url, method } as Request, dist);

  it('answers a file of the build, with the type of its extension', async () => {
    const page = await respond('plm-app://app/index.html');
    assert.strictEqual(page.status, 200);
    assert.strictEqual(await page.text(), '<!doctype html><title>app</title>');
    assert.match(page.headers.get('content-type') ?? '', /^text\/html/);

    const script = await respond('plm-app://app/main-ABC.js');
    assert.strictEqual(script.status, 200);
    assert.match(script.headers.get('content-type') ?? '', /javascript/);

    const media = await respond(`plm-app://app/media/${encodeURIComponent('写真 #1.svg')}`);
    assert.strictEqual(media.status, 200);
    assert.match(media.headers.get('content-type') ?? '', /^image\/svg\+xml/);
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
