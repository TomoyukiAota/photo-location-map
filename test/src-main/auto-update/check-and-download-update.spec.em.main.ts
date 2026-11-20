import assert from 'assert';
import * as crypto from 'crypto';
import electronUpdater from 'electron-updater';
import type { AppUpdater } from 'electron-updater';
// electron-updater's executor of requests, which it makes only for Electron's own app (see updaterOf() below).
import electronHttpExecutor from 'electron-updater/out/electronHttpExecutor.js';
import * as fs from 'fs';
import * as http from 'http';
import type { AddressInfo } from 'net';
import * as os from 'os';
import * as path from 'path';
import { checkAndDownloadUpdate } from '../../../src-main/auto-update/check-and-download-update.js';

const { NsisUpdater } = electronUpdater;
const { ElectronHttpExecutor } = electronHttpExecutor;

// electron-updater itself, with Electron's network, against a server of an update on this machine: what the app's
// autoUpdater does on Windows, without installing anything.
describe('checkAndDownloadUpdate (in main process)', () => {
  const installerName = 'Photo-Location-Map-Setup-99.0.0.exe';
  let folder: string;
  let server: http.Server;

  beforeEach(() => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-update-download-'));
  });

  afterEach(async () => {
    await new Promise(resolve => server?.close(resolve));
    fs.rmSync(folder, { recursive: true, force: true, maxRetries: 5 });
  });

  interface UpdateServer {
    /** The app-update.yml to give the updaters. */
    configPath: string;
    /** Resolves once the first download of the installer has been sent its first half; the rest waits. */
    firstDownloadHalfSent: Promise<void>;
    /** Sends the first download the rest of the installer. The downloads after the first get it whole at once. */
    finishFirstDownload: () => void;
  }

  /**
   * Serves an update as the app's releases do: latest.yml (latest-mac.yml on macOS, latest-linux.yml on Linux, which
   * the updater asks for by its platform), and the installer, or a 404 in its place.
   */
  async function serveUpdate(installer: 'served' | 'missing'): Promise<UpdateServer> {
    const content = crypto.randomBytes(1024 * 1024);
    const sha512 = crypto.createHash('sha512').update(content).digest('base64');
    const latestYml = `version: 99.0.0\nfiles:\n  - url: ${installerName}\n    sha512: ${sha512}\n    size: ${content.length}\n`
      + `path: ${installerName}\nsha512: ${sha512}\nreleaseDate: '2026-01-01T00:00:00.000Z'\n`;
    let halfSent = () => {};
    const firstDownloadHalfSent = new Promise<void>(resolve => (halfSent = resolve));
    let finishFirstDownload = () => {};
    const firstDownloadFinished = new Promise<void>(resolve => (finishFirstDownload = resolve));
    let downloads = 0;

    server = http.createServer((request, response) => {
      if (/^\/latest[\w-]*\.yml/.test(request.url ?? '')) {
        response.end(latestYml);
      } else if (request.url === `/${installerName}` && installer === 'served') {
        response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': content.length });
        if (++downloads > 1) {
          response.end(content);
          return;
        }
        const half = content.length / 2;
        response.write(content.subarray(0, half), () => halfSent());
        void firstDownloadFinished.then(() => response.end(content.subarray(half)));
      } else {
        response.statusCode = 404;
        response.end();
      }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;

    // The app's app-update.yml, which electron-builder writes into the package; without publisherName, which only a
    // signed Windows installer is checked against.
    const configPath = path.join(folder, 'app-update.yml');
    fs.writeFileSync(configPath, `provider: generic\nurl: ${url}\nupdaterCacheDirName: plm-test-updater\n`);
    return { configPath, firstDownloadHalfSent, finishFirstDownload };
  }

  /** Resolves once the file exists, as a download's file does once the server has answered. */
  async function fileToExist(file: string): Promise<void> {
    for (let waited = 0; !fs.existsSync(file); waited += 10) {
      if (waited >= 10_000)
        throw new Error(`${file} did not appear in 10 s.`);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /** An updater of the app, as installed: each process of the app has its own, and they share the cache folder. */
  function updaterOf(configPath: string): AppUpdater {
    const app = {
      version: '1.0.0', name: 'plm-test', isPackaged: true, appUpdateConfigPath: configPath, userDataPath: folder,
      baseCachePath: folder, whenReady: () => Promise.resolve(), relaunch: () => {}, quit: () => {}, onQuit: () => {},
    };
    const updater = new NsisUpdater(null, app);
    // As electron-updater's own tests do: given an app of its own, it leaves the executor of its requests to the caller.
    (updater as unknown as { httpExecutor: unknown }).httpExecutor = new ElectronHttpExecutor();
    updater.logger = null;
    updater.disableDifferentialDownload = true;
    updater.disableWebInstaller = true;
    updater.autoInstallOnAppQuit = false;
    return updater;
  }

  /** How each updater's download ends: the version it downloaded, or the error that its error event gave. */
  function endOf(updater: AppUpdater): Promise<string | Error> {
    return new Promise(resolve => {
      updater.once('update-downloaded', info => resolve(info.version));
      updater.once('error', error => resolve(error));
    });
  }

  /** The rejections that nothing handled while `run` ran, and in the moment after it, when Node tells them. */
  async function unhandledRejectionsWhile(run: () => Promise<unknown>): Promise<unknown[]> {
    const rejections: unknown[] = [];
    const keep = (reason: unknown) => rejections.push(reason);
    process.on('unhandledRejection', keep);
    try {
      await run();
      await new Promise(resolve => setTimeout(resolve, 200));
    } finally {
      process.off('unhandledRejection', keep);
    }
    return rejections;
  }

  it('reports a download that fails with the error event only, not as an unhandled rejection', async () => {
    const updater = updaterOf((await serveUpdate('missing')).configPath);
    const end = endOf(updater);

    const unhandled = await unhandledRejectionsWhile(async () => {
      await checkAndDownloadUpdate(updater);
      await end;
    });

    const error = await end;
    assert.ok(error instanceof Error, `the download should fail, but ended with ${error}`);
    assert.match(error.message, /404/);
    assert.deepEqual(unhandled, []);
  });

  it('reports the failed one of two downloads of the same update at once with the error event only', async () => {
    // Two processes of the app download the update into the same cache folder: the second starts and finishes while
    // the first downloads, and the first finishes after it. Both write the folder's one temp- file, which the second
    // makes anew and renames; the first then finds no file to rename.
    const update = await serveUpdate('served');
    const [first, second] = [updaterOf(update.configPath), updaterOf(update.configPath)];
    const [firstEnd, secondEnd] = [endOf(first), endOf(second)];

    const unhandled = await unhandledRejectionsWhile(async () => {
      await checkAndDownloadUpdate(first);
      await update.firstDownloadHalfSent;
      await fileToExist(path.join(folder, 'plm-test-updater', 'pending', `temp-${installerName}`));
      await checkAndDownloadUpdate(second);
      await secondEnd;
      update.finishFirstDownload();
      await firstEnd;
    });

    assert.equal(await secondEnd, '99.0.0');
    const error = await firstEnd;
    assert.ok(error instanceof Error, `the first download should fail, but it ended with ${error}`);
    assert.match(error.message, /^ENOENT: no such file or directory, rename '.*temp-Photo-Location-Map-Setup-99\.0\.0\.exe' -> /);
    assert.deepEqual(unhandled, []);
  });
});
