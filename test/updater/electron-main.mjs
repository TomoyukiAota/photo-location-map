import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { app, autoUpdater as nativeUpdater, session } from 'electron';
import ts from 'typescript';
import manifest from '../../package.json' with { type: 'json' };
process.on('uncaughtException', error => { console.error(error); app.exit(1); });

const repository = path.resolve(import.meta.dirname, '../..');
const root = fs.realpathSync(process.env.PLM_UPDATER_TEST_ROOT || '/invalid-updater-test-root');
const owner = JSON.parse(fs.readFileSync(path.join(root, 'owner.json'), 'utf8'));
assert.equal(owner.kind, 'plm-updater-integration');
assert.equal(owner.nonce, process.env.PLM_UPDATER_TEST_NONCE);
assert.match(owner.nonce, /^[a-f0-9]{48}$/);
assert.match(path.basename(root), /^plm-updater-/);

function owned(...parts) {
  const result = path.resolve(root, ...parts);
  const relative = path.relative(root, result);
  assert.ok(relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
  return result;
}

app.setName('PLM Updater Regression');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
for (const name of ['appData', 'userData', 'sessionData', 'logs', 'crashDumps', 'temp']) {
  const directory = owned(name);
  fs.mkdirSync(directory, { recursive: true });
  app.setPath(name, directory);
}
let allowedOrigin = null;
const unexpectedRequests = [];
const guardedSessions = new Set();
function guardNetwork(target) {
  if (guardedSessions.has(target)) return;
  guardedSessions.add(target);
  target.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const permitted = allowedOrigin !== null && new URL(details.url).origin === allowedOrigin;
    if (!permitted) unexpectedRequests.push(details.url);
    callback({ cancel: !permitted });
  });
}
app.on('session-created', guardNetwork);

// Do not let even native feed initialization access Squirrel's OS caches.
const nativeCalls = { setFeedURL: 0, checkForUpdates: 0, quitAndInstall: 0 };
Object.defineProperty(nativeUpdater, 'setFeedURL', { configurable: true, value: options => {
  const url = new URL(options.url);
  assert.equal(url.protocol, 'http:');
  assert.equal(url.hostname, '127.0.0.1');
  nativeCalls.setFeedURL++;
} });
for (const method of ['checkForUpdates', 'quitAndInstall']) {
  Object.defineProperty(nativeUpdater, method, { configurable: true, value: () => {
    nativeCalls[method]++;
    throw new Error(`Native ${method} is prohibited in this download-only check.`);
  } });
}

const logger = { info() {}, warn() {}, error() {}, debug() {} };

// TL;DR: Runs a module of the application with the dependencies that `imports` gives, a new instance at each call.
// Details: The application's modules are ES modules, which Node loads once for each path, with their own imports. So
// the module's TypeScript is compiled here into a CommonJS module, whose require() is the stand-in of `imports`.
function runTranspiled(relative, imports) {
  const filename = path.join(repository, relative);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency in application guard check: ${name}`);
      return imports[name];
    },
  }, { filename });
  return module.exports;
}

// The compiled module of the application that has no dependencies, and reads the OS version of this computer.
const minimumSystemVersion = await import(pathToFileURL(path.join(repository, 'out/app/src-main/auto-update/minimum-system-version.js')).href);

// The auto-update setup, run against the given app and updater with its other dependencies controlled.
function runConfigureAutoUpdate({ application, updater, isDev = false, prerelease, trackEvent = () => {} }) {
  runTranspiled('src-main/auto-update/configure-auto-update.ts', {
    electron: { app: application, dialog: { showMessageBox: async () => ({ response: 1 }) } },
    'electron-updater': { autoUpdater: updater },
    '../../src-shared/analytics/analytics.js': { Analytics: { trackEvent } },
    '../../src-shared/analytics/record-error.js': { scrubbedErrorLabel: () => '' },
    '../../src-shared/dev-or-prod/dev-or-prod.js': { DevOrProd: { isDev } },
    '../../src-shared/i18n/i18n.js': { t: key => key },
    '../../src-shared/log/logged-line.js': { logged: (strings, ...values) => String.raw({ raw: strings }, ...values), shown: value => value },
    '../../src-shared/version/is-prerelease-version.js': prerelease,
    '../electron-main.js': { mainWindow: null },
    './auto-update-logger.js': { autoUpdateLogger: logger },
    './minimum-system-version.js': minimumSystemVersion,
  });
}

// Puts the application's own isUpdateSupported on a real updater. The setup runs against a stand-in that holds the real
// updater's default check, and the check that the setup puts in its place moves to the real updater.
function useApplicationUpdateSupport(realUpdater, trackEvent) {
  const application = new EventEmitter();
  application.getVersion = () => '1.12.1';
  const standIn = new EventEmitter();
  standIn.isUpdateSupported = realUpdater.isUpdateSupported;
  runConfigureAutoUpdate({ application, updater: standIn, prerelease: { isPrereleaseVersion: () => false }, trackEvent });
  assert.notEqual(standIn.isUpdateSupported, realUpdater.isUpdateSupported, 'The application must replace isUpdateSupported.');
  realUpdater.isUpdateSupported = standIn.isUpdateSupported;
}

/** Checks which versions look for an update at launch: none in development or for a prerelease, one otherwise. */
async function verifyApplicationPolicy() {
  const actualVersion = manifest.version;
  const cases = [
    { version: '1.12.1', dev: false, checks: 1 },
    { version: '1.12.1', dev: true, checks: 0 },
    { version: actualVersion, dev: false, checks: /alpha|beta|rc/i.test(actualVersion) ? 0 : 1 },
    { version: '1.12.2-beta.1', dev: false, checks: 0 },
    { version: '1.12.2-rc.1', dev: false, checks: 0 },
    { version: '1.12.2-ALPHA.1', dev: false, checks: 0 },
  ];
  for (const item of cases) {
    const application = new EventEmitter();
    application.getVersion = () => item.version;
    const prerelease = runTranspiled('src-shared/version/is-prerelease-version.ts', {
      '../startup/startup-metadata.js': { startupMetadata: () => ({ version: application.getVersion() }) },
    });
    const updater = new EventEmitter();
    let checks = 0;
    updater.checkForUpdates = async () => { checks++; };
    updater.quitAndInstall = () => { throw new Error('The policy check must not install an update.'); };
    runConfigureAutoUpdate({ application, updater, isDev: item.dev, prerelease });
    const handlers = application.listeners('ready');
    assert.equal(handlers.length, 1);
    await handlers[0]();
    assert.equal(checks, item.checks);
  }
  return cases.map(({ version, dev, checks }) => ({ version, development: dev, updateChecks: checks }));
}

function fixtureZip() {
  const name = Buffer.from('updater-fixture.txt');
  const data = Buffer.from('Synthetic PLM updater transport fixture. Not an installable application.\n'.repeat(64));
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x21, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x21, 14); central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12); end.writeUInt32LE(local.length + name.length + data.length, 16);
  return Buffer.concat([local, name, data, central, name, end]);
}

async function hashFile(file) {
  const hash = crypto.createHash('sha512');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('base64');
}

async function main() {
  await app.whenReady();
  const applicationPolicy = await verifyApplicationPolicy();
  const supplied = process.env.PLM_UPDATER_ARTIFACT;
  const artifact = supplied || owned('synthetic-fixture.zip');
  if (supplied) {
    const relative = path.relative(repository, fs.realpathSync(supplied));
    assert.ok(['release' + path.sep, '.upgrade-artifacts' + path.sep].some(prefix => relative.startsWith(prefix)));
  }
  if (!supplied) await fsp.writeFile(artifact, fixtureZip());
  const size = (await fsp.stat(artifact)).size;
  const sha512 = await hashFile(artifact);
  const publishedName = path.basename(artifact).replaceAll(' ', '-');
  assert.equal(path.basename(publishedName), publishedName);
  const candidateVersion = manifest.version;
  let feedVersion = candidateVersion;
  let expectedHash = sha512;
  // What electron-builder writes from mac.releaseInfo.vendor of electron-builder.json, when set.
  let feedVendor;
  const requests = { metadata: 0, artifact: 0 };
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    if (pathname === '/latest-mac.yml') {
      requests.metadata++;
      const metadata = JSON.stringify({ version: feedVersion,
        files: [{ url: publishedName, sha512: expectedHash, size }], path: publishedName,
        sha512: expectedHash, releaseDate: '2026-11-01T00:00:00.000Z', ...(feedVendor && { vendor: feedVendor }) });
      response.writeHead(200, { 'Content-Type': 'application/yaml', 'Content-Length': Buffer.byteLength(metadata) });
      response.end(metadata);
    } else if (decodeURIComponent(pathname) === '/' + publishedName) {
      requests.artifact++;
      response.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': size });
      const stream = fs.createReadStream(artifact);
      stream.on('error', error => response.destroy(error));
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } else {
      response.writeHead(404); response.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  allowedOrigin = origin;
  guardNetwork(session.defaultSession);
  const configFile = owned('app-update.yml');
  await fsp.writeFile(configFile, JSON.stringify({ provider: 'generic', url: origin,
    channel: 'latest', updaterCacheDirName: 'updater-cache' }));

  // Imported once the app's folders are set. electron-updater is CommonJS: its default import is its module.exports.
  const { default: { MacUpdater } } = await import('electron-updater');
  const { default: { ElectronHttpExecutor, NET_SESSION_NAME } } = await import('electron-updater/out/electronHttpExecutor.js');
  const { default: { version: updaterVersion } } = await import('electron-updater/package.json', { with: { type: 'json' } });
  assert.match(updaterVersion, /^6\./, 'Review the download-only isolation seam before using another updater major.');
  guardNetwork(session.fromPartition(NET_SESSION_NAME, { cache: false }));
  const adapter = version => ({
    version, name: 'PLM Updater Regression', isPackaged: true,
    appUpdateConfigPath: configFile, userDataPath: owned('userData'), baseCachePath: owned('cache'),
    whenReady: () => app.whenReady(),
    onQuit: handler => app.once('quit', (_, code) => handler(code)),
    quit() { throw new Error('AppAdapter.quit is prohibited.'); },
    relaunch() { throw new Error('AppAdapter.relaunch is prohibited.'); },
  });
  function makeUpdater(version) {
    const updater = new MacUpdater(undefined, adapter(version));
    // Supplying an AppAdapter intentionally leaves the executor null. This
    // source-backed test seam stays outside all production configuration.
    updater.httpExecutor = new ElectronHttpExecutor();
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.disableDifferentialDownload = true;
    updater.logger = logger;
    updater.setFeedURL({ provider: 'generic', url: origin, channel: 'latest', useMultipleRangeRequest: false });
    return updater;
  }
  try {
    // A release whose vendor.minimumSystemVersion is newer than this Mac's macOS is not offered; the application's check
    // reads it from latest-mac.yml as the real MacUpdater parses it.
    const skippedForMacOs = [];
    const supportChecked = makeUpdater('1.12.1');
    useApplicationUpdateSupport(supportChecked, (category, action, label) => skippedForMacOs.push({ category, action, label }));
    feedVendor = { minimumSystemVersion: '999.0' };
    assert.equal((await supportChecked.checkForUpdates()).isUpdateAvailable, false, 'A release for a newer macOS must not be offered.');
    assert.deepEqual(skippedForMacOs.map(event => event.action), ['Auto-update: Skipped for OS version']);
    feedVendor = { minimumSystemVersion: process.getSystemVersion() };
    assert.equal((await supportChecked.checkForUpdates()).isUpdateAvailable, true, 'A release for this macOS must be offered.');
    feedVendor = undefined;
    assert.equal((await supportChecked.checkForUpdates()).isUpdateAvailable, true, 'A release without a minimum must be offered.');
    assert.equal(skippedForMacOs.length, 1);

    const updater = makeUpdater('1.12.1');
    assert.equal(updater.allowPrerelease, false);
    assert.equal(updater.allowDowngrade, false);
    assert.equal((await updater.checkForUpdates()).isUpdateAvailable, true);
    feedVersion = '1.12.1';
    assert.equal((await updater.checkForUpdates()).isUpdateAvailable, false);
    feedVersion = '1.11.0';
    assert.equal((await updater.checkForUpdates()).isUpdateAvailable, false);
    updater.allowDowngrade = true;
    assert.equal((await updater.checkForUpdates()).isUpdateAvailable, true);
    updater.allowDowngrade = false;
    updater.channel = 'latest';
    assert.equal(updater.allowDowngrade, true);
    updater.allowDowngrade = false;
    feedVersion = candidateVersion;
    await updater.checkForUpdates();
    let downloaded;
    updater.on('update-downloaded', event => downloaded = event);
    await updater.downloadUpdate();
    assert.ok(downloaded);
    assert.equal(downloaded.version, candidateVersion);
    assert.equal(downloaded.downloadedFile, owned('cache', 'updater-cache', 'pending', publishedName));
    assert.equal(await hashFile(downloaded.downloadedFile), sha512);
    assert.equal(requests.artifact, 1);

    const second = makeUpdater('1.12.1');
    await second.checkForUpdates();
    let reused;
    second.on('update-downloaded', event => reused = event);
    await second.downloadUpdate();
    assert.equal(reused.downloadedFile, downloaded.downloadedFile);
    assert.equal(requests.artifact, 1, 'A fresh updater must validate and reuse the persistent cached ZIP.');

    expectedHash = crypto.createHash('sha512').update('Deliberately incorrect update checksum.').digest('base64');
    await second.checkForUpdates();
    await assert.rejects(second.downloadUpdate(), error => error.code === 'ERR_CHECKSUM_MISMATCH');
    assert.equal(requests.artifact, 2);
    assert.equal(fs.existsSync(downloaded.downloadedFile), false, 'A rejected update must not remain installable in pending/.');
    const prereleaseUpdater = makeUpdater(candidateVersion);
    assert.equal(prereleaseUpdater.allowPrerelease, /-/.test(candidateVersion));
    assert.equal(nativeCalls.checkForUpdates, 0);
    assert.equal(nativeCalls.quitAndInstall, 0);
    assert.ok(nativeCalls.setFeedURL >= 2, 'The real MacUpdater download-complete path must reach the intercepted handoff.');
    assert.equal(unexpectedRequests.length, 0);
    for (const name of ['appData', 'userData', 'sessionData', 'logs', 'crashDumps', 'temp']) {
      assert.equal(app.getPath(name), owned(name));
    }
    const report = {
      status: 'passed', mode: supplied ? 'provided-artifact-download-only' : 'synthetic-zip-transport-only',
      electron: process.versions.electron, embeddedNode: process.versions.node, updater: updaterVersion,
      applicationVersion: candidateVersion, applicationPolicy,
      artifact: { name: path.basename(artifact), size, sha512 },
      availability: { newer: true, sameVersion: false, downgradeDefault: false, downgradeOptIn: true },
      macOsMinimum: { newerMacOsSkipped: true, thisMacOsOffered: true, noMinimumOffered: true },
      persistentCacheReuse: true, corruptChecksumRejected: true, rejectedPendingFileRemoved: true,
      isolatedAppData: true, isolatedUserData: true, isolatedSessionData: true, isolatedUpdaterCache: true,
      externalRequests: unexpectedRequests.length, guardedSessionCount: guardedSessions.size, requests, nativeCalls,
      nativeFeedSetupIntercepted: true, installationExercised: false, rollbackExercised: false,
      codeSignatureValidationExercised: false,
    };
    await fsp.writeFile(owned('report.json'), JSON.stringify(report, null, 2) + '\n');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

main().then(() => app.exit(0)).catch(error => { console.error(error); app.exit(1); });
