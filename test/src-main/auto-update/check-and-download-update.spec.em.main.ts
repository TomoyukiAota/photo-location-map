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

  /**
   * Serves an update as the app's releases do: latest.yml (latest-mac.yml on macOS, latest-linux.yml on Linux, which
   * the updater asks for by its platform), and the installer, or a 404 in its place. The installer is sent in parts, and
   * only once `downloadsAtOnce` requests for it have arrived, so that their downloads overlap.
   */
  async function serveUpdate(installer: 'served' | 'missing', downloadsAtOnce = 1): Promise<string> {
    const content = crypto.randomBytes(1024 * 1024);
    const sha512 = crypto.createHash('sha512').update(content).digest('base64');
    const latestYml = `version: 99.0.0\nfiles:\n  - url: ${installerName}\n    sha512: ${sha512}\n    size: ${content.length}\n`
      + `path: ${installerName}\nsha512: ${sha512}\nreleaseDate: '2026-01-01T00:00:00.000Z'\n`;
    const waiting: http.ServerResponse[] = [];
    const send = (response: http.ServerResponse) => {
      response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': content.length });
      const parts = 10;
      let sent = 0;
      const timer = setInterval(() => {
        response.write(content.subarray(sent * content.length / parts, (sent + 1) * content.length / parts));
        if (++sent === parts) {
          clearInterval(timer);
          response.end();
        }
      }, 20);
    };

    server = http.createServer((request, response) => {
      if (/^\/latest[\w-]*\.yml/.test(request.url ?? '')) {
        response.end(latestYml);
      } else if (request.url?.startsWith(`/${installerName}`) && installer === 'served') {
        waiting.push(response);
        if (waiting.length === downloadsAtOnce)
          waiting.forEach(send);
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
    return configPath;
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
    const updater = updaterOf(await serveUpdate('missing'));
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
    // Two processes of the app, started together, download the update into the same cache folder.
    const configPath = await serveUpdate('served', 2);
    const updaters = [updaterOf(configPath), updaterOf(configPath)];
    const ends = updaters.map(endOf);

    const unhandled = await unhandledRejectionsWhile(async () => {
      await Promise.all(updaters.map(checkAndDownloadUpdate));
      await Promise.all(ends);
    });

    const results = await Promise.all(ends);
    const failures = results.filter(end => end instanceof Error);
    assert.deepEqual(results.filter(end => !(end instanceof Error)), ['99.0.0']);
    assert.equal(failures.length, 1, `one of the downloads should fail, but they ended with ${results.join(', ')}`);
    assert.match(failures[0].message, /^ENOENT: no such file or directory, rename '.*temp-Photo-Location-Map-Setup-99\.0\.0\.exe' -> /);
    assert.deepEqual(unhandled, []);
  });
});
