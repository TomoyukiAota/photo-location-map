import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { mayShowFile, respondToPhotoFileRequest } from '../../../src-main/file-server/photo-files.js';
import { forgetUserChosenFolders, isInFolder, rememberUserChosenFolder } from '../../../src-main/ipc/user-chosen-folders.js';
import { photoFilePathOf, photoFileUrl } from '../../../src-shared/main-window-schemes.js';
import { plmThumbnailCacheDir } from '../../../src-shared/thumbnail/cache/thumbnail-cache-util.js';

describe('The photos of the main window\'s page (in main process)', () => {
  let root: string;
  let opened: string;
  let cache: string;
  let photo: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-photo-files-'));
    opened = path.join(root, 'opened 写真 # 100%');
    cache = path.join(root, 'cache');
    fs.mkdirSync(path.join(opened, 'day 1'), { recursive: true });
    fs.mkdirSync(path.join(root, 'outside'), { recursive: true });
    fs.mkdirSync(cache, { recursive: true });
    photo = path.join(opened, 'day 1', 'IMG #1 50%?.jpg');
    fs.writeFileSync(photo, 'photo');
    fs.writeFileSync(path.join(root, 'outside', 'secret.jpg'), 'not to be shown');
    fs.writeFileSync(path.join(cache, 'IMG_0002.HEIC.plm.jpg'), 'thumbnail');
  });

  after(() => {
    forgetUserChosenFolders();
    fs.rmSync(root, { recursive: true, force: true });
  });

  /** The answer to a request of the page, as protocol.handle gives it, with only what the handler reads. */
  const respond = (url: string, method = 'GET') => respondToPhotoFileRequest({ url, method } as Request,
    filePath => isInFolder(filePath, opened) || isInFolder(filePath, cache));

  it('gives an address whose path comes back whole, whatever its characters', () => {
    for (const filePath of [photo, 'C:\\Users\\a b\\写真\\#1 %20.jpg', '/a/b?c#d'])
      assert.strictEqual(photoFilePathOf(photoFileUrl(filePath)), filePath, filePath);
    for (const url of ['plm-file://other/%2Fa.jpg', 'plm-app://app/index.html', 'file:///a.jpg', 'plm-file://local/%E0%A4%A'])
      assert.strictEqual(photoFilePathOf(url), undefined, url);
  });

  it('answers a photo of an opened folder, and a thumbnail that the app made', async () => {
    const shown = await respond(photoFileUrl(photo));
    assert.strictEqual(shown.status, 200);
    assert.strictEqual(await shown.text(), 'photo');
    assert.match(shown.headers.get('content-type') ?? '', /^image\/jpeg/);

    const thumbnail = await respond(photoFileUrl(path.join(cache, 'IMG_0002.HEIC.plm.jpg')));
    assert.strictEqual(thumbnail.status, 200);
    assert.strictEqual(await thumbnail.text(), 'thumbnail');
  });

  it('answers nothing of another folder, as a file that is not there, however the path is written', async () => {
    for (const filePath of [
      path.join(root, 'outside', 'secret.jpg'),
      `${opened}${path.sep}..${path.sep}outside${path.sep}secret.jpg`,
      path.join('outside', 'secret.jpg'),
      path.join(opened, 'day 1'),
      path.join(opened, 'missing.jpg'),
    ])
      assert.strictEqual((await respond(photoFileUrl(filePath))).status, 404, filePath);
    assert.strictEqual((await respond(`plm-file://other/${encodeURIComponent(photo)}`)).status, 404);
    assert.strictEqual((await respond('plm-file://local/%E0%A4%A')).status, 404);
  });

  it('only reads', async () => {
    assert.strictEqual((await respond(photoFileUrl(photo), 'POST')).status, 405);
  });

  it('lets the page show the files of the folders that the user opened, and the thumbnails of the app\'s cache', () => {
    forgetUserChosenFolders();
    assert.strictEqual(mayShowFile(photo), false);
    rememberUserChosenFolder(opened);
    assert.strictEqual(mayShowFile(photo), true);
    assert.strictEqual(mayShowFile(path.join(root, 'outside', 'secret.jpg')), false);
    assert.strictEqual(mayShowFile(path.join(plmThumbnailCacheDir, 'photos', 'IMG_0002.HEIC.plm.jpg')), true);
  });
});
