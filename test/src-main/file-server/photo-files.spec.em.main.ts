import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { respondToPhotoFileRequest, showablePath, showablePathIn } from '../../../src-main/file-server/photo-files.js';
import { forgetUserChosenFolders, rememberUserChosenFolder } from '../../../src-main/ipc/user-chosen-folders.js';
import { photoFilePathOf, photoFileUrl } from '../../../src-shared/main-window-schemes.js';

describe('The photos of the main window\'s page (in main process)', () => {
  let root: string;
  let opened: string;
  let cache: string;
  let photo: string;
  let secret: string;

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-photo-files-'));
    opened = path.join(root, 'opened 写真 # 100%');
    cache = path.join(root, 'cache');
    fs.mkdirSync(path.join(opened, 'day 1'), { recursive: true });
    fs.mkdirSync(path.join(root, 'outside'), { recursive: true });
    fs.mkdirSync(cache, { recursive: true });
    // Characters that an address would read otherwise, in a name that every file system takes (Windows takes no "?").
    photo = path.join(opened, 'day 1', 'IMG #1 50%.jpg');
    fs.writeFileSync(photo, 'photo');
    secret = path.join(root, 'outside', 'secret.jpg');
    fs.writeFileSync(secret, 'not to be shown');
    fs.writeFileSync(path.join(cache, 'IMG_0002.HEIC.plm.jpg'), 'thumbnail');
  });

  after(() => {
    forgetUserChosenFolders();
    fs.rmSync(root, { recursive: true, force: true });
  });

  /** The answer to a request of the page, as protocol.handle gives it, with only what the handler reads. */
  const respond = (url: string, method = 'GET') => respondToPhotoFileRequest({ url, method } as Request,
    filePath => showablePathIn(filePath, [opened, cache]));

  /** Makes a link, or skips the test where links cannot be made, as on Windows without the right to. */
  function link(context: Mocha.Context, target: string, at: string, kind: 'file' | 'folder'): void {
    try {
      fs.symlinkSync(target, at, kind === 'folder' && process.platform === 'win32' ? 'junction' : kind === 'folder' ? 'dir' : 'file');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM')
        context.skip();
      throw error;
    }
  }

  it('gives an address whose path comes back whole, whatever its characters, with only unreserved ones unescaped', () => {
    for (const filePath of [photo, 'C:\\Users\\a b\\写真\\#1 %20.jpg', '/a/b?c#d', "/photos/(private)/it's a!*.jpg"]) {
      const url = photoFileUrl(filePath);
      assert.match(url, /^plm-file:\/\/local\/[\w.~%-]*$/, url);
      assert.strictEqual(photoFilePathOf(url), filePath, filePath);
    }
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
      secret,
      `${opened}${path.sep}..${path.sep}outside${path.sep}secret.jpg`,
      path.join('outside', 'secret.jpg'),
      path.join(opened, 'day 1'),
      path.join(opened, 'missing.jpg'),
    ])
      assert.strictEqual((await respond(photoFileUrl(filePath))).status, 404, filePath);
    assert.strictEqual((await respond(`plm-file://other/${encodeURIComponent(photo)}`)).status, 404);
    assert.strictEqual((await respond('plm-file://local/%E0%A4%A')).status, 404);
  });

  it('answers nothing that a link in an opened folder leads to elsewhere, whether the link is the file or a folder on the way', async function () {
    link(this, secret, path.join(opened, 'link to a file.jpg'), 'file');
    link(this, path.join(root, 'outside'), path.join(opened, 'link to a folder'), 'folder');

    assert.strictEqual((await respond(photoFileUrl(path.join(opened, 'link to a file.jpg')))).status, 404);
    assert.strictEqual((await respond(photoFileUrl(path.join(opened, 'link to a folder', 'secret.jpg')))).status, 404);
  });

  it('answers a photo of an opened folder that is itself a link, by the folder\'s real path', async function () {
    const linkedFolder = path.join(root, 'link to the opened folder');
    link(this, opened, linkedFolder, 'folder');

    const shown = await respondToPhotoFileRequest({ url: photoFileUrl(path.join(linkedFolder, 'day 1', 'IMG #1 50%.jpg')), method: 'GET' } as Request,
      filePath => showablePathIn(filePath, [linkedFolder]));
    assert.strictEqual(shown.status, 200);
    assert.strictEqual(await shown.text(), 'photo');
  });

  it('takes the case of a path as the file system does: one folder in any case where it ignores case, two where not', async () => {
    const folder = path.join(root, 'Case');
    fs.mkdirSync(folder);
    fs.writeFileSync(path.join(folder, 'a.jpg'), 'photo');
    const ignoresCase = fs.existsSync(path.join(root, 'case'));
    if (ignoresCase) {
      assert.strictEqual(await showablePathIn(path.join(root, 'case', 'A.JPG'), [folder]), fs.realpathSync.native(path.join(folder, 'a.jpg')));
    } else {
      fs.mkdirSync(path.join(root, 'case'));
      fs.writeFileSync(path.join(root, 'case', 'secret.jpg'), 'not to be shown');
      assert.strictEqual(await showablePathIn(path.join(root, 'case', 'secret.jpg'), [folder]), undefined);
      assert.strictEqual(await showablePathIn(path.join(folder, 'a.jpg'), [folder]), fs.realpathSync.native(path.join(folder, 'a.jpg')));
    }
  });

  it('only reads', async () => {
    assert.strictEqual((await respond(photoFileUrl(photo), 'POST')).status, 405);
  });

  it('lets the page show the files of the folders that the user opened', async () => {
    // The thumbnail cache is the user's own here (PLM_TEST_ROOT is not set), so it is left alone: the tests above take
    // a cache of their own, and the e2e suite shows the thumbnails of its profile's.
    forgetUserChosenFolders();
    assert.strictEqual(await showablePath(photo), undefined);
    rememberUserChosenFolder(opened);
    // The native real path, as fs.promises.realpath gives it: on Windows, with a short name of a folder (RUNNER~1) long.
    assert.strictEqual(await showablePath(photo), fs.realpathSync.native(photo));
    assert.strictEqual(await showablePath(secret), undefined);
  });
});
