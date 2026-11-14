import { test, expect, _electron } from 'playwright/test';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { jpegWithEmptyGpsValues } from '../test-util/jpeg-with-empty-gps-values.mjs';
import { jpegWithLocationOnly } from '../test-util/jpeg-with-location-only.mjs';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const manifest = require('../../package.json');
const visual = process.env.PLM_VISUAL === '1';
const packagedExecutable = process.env.PLM_PACKAGED_EXECUTABLE;
const packagedLauncher = process.env.PLM_E2E_LAUNCHER;
const liveReload = process.env.PLM_E2E_LIVE_RELOAD === '1';
if (liveReload && packagedExecutable) throw new Error('Live reload is verified with the checkout, not a packaged executable.');
const expectedArch = process.env.PLM_E2E_EXPECTED_ARCH || process.arch;
if (packagedExecutable && !path.isAbsolute(packagedExecutable)) throw new Error('PLM_PACKAGED_EXECUTABLE must be absolute.');
if (packagedLauncher && (!packagedExecutable || !path.isAbsolute(packagedLauncher))) {
  throw new Error('PLM_E2E_LAUNCHER requires a packaged executable and an absolute launcher path.');
}
const photoFolder = path.join(root, 'test/test-resources/actual-photos');
let app, page, profile, headless;
// What a development build reported as NG0100: a binding that changed without telling Angular, which OnPush
// components and zoneless change detection would not render (see src/app/app.config.ts). A production build checks
// nothing.
let changedWithoutNotification = [];
// TL;DR: On macOS and Windows, the windows stay off the screen, as Playwright's browsers do, unless --headed
// is given: hidden on macOS, and on Windows shown but transparent, click-through and never activated
// (see electron-util/e2e-test-hooks.js). On Linux, they are shown; Linux CI runs under Xvfb.
// Details: With hidden windows, the suite took 3.7 minutes instead of 1.6 on Windows CI and 4.8 instead of
// 2.1 on Ubuntu CI, against 1.7 instead of 1.6 on macOS. The cases with many Playwright actions, which wait
// for animation frames, slowed down the most, and on Windows the map case failed: the app's zoom to the
// photos, which Leaflet starts in the next animation frame, began only at the next click. Windows' transparent
// windows do not help on Linux: Electron applies their opacity to the window's content layer, which is then not
// drawn either. On Ubuntu CI, the main window got 1 animation frame per second, and the suite took 5.0 minutes
// instead of 2.1 (#642). Linux CI runs under Xvfb, so the windows shown there are not on anyone's screen.
test.beforeAll(({ headless: headlessOption }) => { headless = headlessOption && process.platform !== 'linux'; });
async function expectWindowOffScreenOnlyIfHeadless(window) {
  const state = await window.evaluate(window => ({ visible: window.isVisible(), opacity: window.getOpacity(), focused: window.isFocused() }));
  if (!headless) expect(state.visible, 'The window must be shown.').toBe(true);
  else if (process.platform === 'win32') {
    expect(state, 'A headless run on Windows must show the window only fully transparent and inactive.')
      .toEqual({ visible: true, opacity: 0, focused: false });
  } else expect(state.visible, 'A headless run must keep the window hidden.').toBe(false);
}
/**
 * Launches the application on the test profile, finds its main window as `page`, and checks how it runs. In a
 * profile whose user has not confirmed a language, the application shows the Language dialog first: it is confirmed
 * here, with the language that it offers, unless `languageDialog` is 'keep', for the cases about the dialog. The
 * application takes en-US as the operating system's language in a test profile, whatever the machine's is, unless
 * `env` gives others in PLM_TEST_SYSTEM_LANGUAGES (src-main/startup/startup-metadata-setup.ts).
 */
async function launch({ resize = true, env: extraEnv = {}, languageDialog = 'confirm' } = {}) {
  const env = { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: headless ? '1' : '0', ...extraEnv };
  for (const key of ['PLM_EM_MAIN', 'PLM_EM_RENDERER', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS']) delete env[key];
  // A publicly launched package has no npm development-profile override.
  if (packagedExecutable) delete env.npm_package_config_devOrProd;
  const openArgs = [
    // Exercise the NSIS post-update argv on the actual installed Windows app.
    ...(packagedExecutable && process.platform === 'win32' ? ['--updated'] : []),
    ...(liveReload ? ['--live-reload'] : []),
    ...(process.env.PLM_E2E_OPEN ? ['--open', process.env.PLM_E2E_OPEN] : []),
  ];
  app = await _electron.launch({ executablePath: packagedLauncher || packagedExecutable || require('electron'),
    args: packagedExecutable ? openArgs : ['test/e2e/main.mjs', ...openArgs],
    cwd: packagedExecutable ? profile : root, env, timeout: packagedExecutable ? 90000 : 30000 });
  // Listened to for every page from the launch on, so that what the first change detection reports is not missed.
  app.context().on('console', message => {
    if (message.type() === 'error' && message.text().includes('NG0100')) changedWithoutNotification.push(message.text());
  });
  const pageErrors = [];
  app.context().on('weberror', webError => {
    pageErrors.push(webError.error().message);
    if (webError.error().message.includes('NG0100')) changedWithoutNotification.push(webError.error().message);
  });
  // The requests that have not finished, and those that failed, for a launch whose home view does not render: the
  // page waits for the list of the map's base layers, which it downloads, before it starts Angular
  // (src/start-app.ts). Each request is kept by itself, as two can have one address, and counts as finished once its
  // answer is read to the end, which is what the page waits for.
  const unfinishedRequests = new Set();
  const failedRequests = [];
  const addressOf = request => request.url().slice(0, 160);
  app.context().on('request', request => unfinishedRequests.add(request));
  app.context().on('requestfinished', request => unfinishedRequests.delete(request));
  app.context().on('requestfailed', request => {
    unfinishedRequests.delete(request);
    // The suite cancels the requests of analytics and of downloads itself (electron-util/e2e-test-hooks.js).
    const reason = request.failure()?.errorText ?? 'failed';
    if (reason !== 'net::ERR_BLOCKED_BY_CLIENT') failedRequests.push(`${addressOf(request)}: ${reason}`);
  });
  // A request that the server refuses, as one too many, finishes like any other.
  app.context().on('response', response => {
    if (response.status() >= 400) failedRequests.push(`${addressOf(response.request())}: HTTP ${response.status()}`);
  });
  const runtime = await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    if (typeof require !== 'function') throw new Error('The application is missing its gated E2E hooks; rebuild it before testing.');
    const path = require('node:path');
    const appRoot = app.getAppPath();
    return { packaged: app.isPackaged, appRoot, resources: process.resourcesPath, executable: process.execPath,
      appImage: process.env.APPIMAGE, version: app.getVersion(), versions: process.versions,
      updated: process.argv.includes('--updated'),
      arch: process.arch, translated: app.runningUnderARM64Translation,
      paths: ['appData', 'userData', 'sessionData'].map(name => app.getPath(name)),
      prod: require(path.join(appRoot, 'out/app/src-shared/dev-or-prod/dev-or-prod.js')).DevOrProd.isProd,
      unitTest: require(path.join(appRoot, 'out/app/src-shared/environment/environment-detector.js')).EnvironmentDetector.isUnitTest,
      dependencies: require(path.join(appRoot, 'package.json')).dependencies };
  });
  expect(runtime.unitTest).toBe(false);
  expect(runtime.arch).toBe(expectedArch);
  for (const directory of runtime.paths) expect((await realpath(directory)).startsWith((await realpath(profile)) + path.sep)).toBe(true);
  if (packagedExecutable) {
    if (process.platform === 'win32') expect(runtime.updated).toBe(true);
    expect(runtime.packaged).toBe(true);
    expect(runtime.prod).toBe(true);
    expect(runtime.version).toBe(manifest.version);
    expect(runtime.versions.electron).toBe(manifest.devDependencies.electron);
    expect(runtime.versions.node.split('.')[0]).toBe(manifest.devDependencies['@types/node'].match(/\d+/)[0]);
    expect(runtime.dependencies).toEqual(manifest.dependencies);
    expect(await realpath(runtime.appRoot)).toBe(await realpath(path.join(runtime.resources, 'app.asar')));
    const launchedExecutable = process.platform === 'linux' && packagedExecutable.endsWith('.AppImage')
      ? runtime.appImage : runtime.executable;
    expect(await realpath(launchedExecutable)).toBe(await realpath(packagedExecutable));
    if (process.platform === 'darwin' && process.arch === 'arm64' && expectedArch === 'x64') expect(runtime.translated).toBe(true);
    await test.info().attach('packaged-runtime', { contentType: 'application/json', body: Buffer.from(JSON.stringify({
      packaged: runtime.packaged, prod: runtime.prod, version: runtime.version, versions: runtime.versions,
      arch: runtime.arch, translated: runtime.translated, appPathWithinResources: path.relative(runtime.resources, runtime.appRoot),
      executableMatches: true, isolatedPaths: true, runtimeDependenciesMatch: true,
    }, null, 2)) });
  }
  page = await app.firstWindow();
  if (liveReload) {
    // Select the HTTP application page in development mode.
    await expect.poll(() => {
      const main = app.windows().find(candidate => candidate.url().startsWith('http://localhost:4200'));
      if (main) page = main;
      return !!main;
    }, { timeout: 30000 }).toBe(true);
  }
  const mainWindow = await app.browserWindow(page);
  await expectWindowOffScreenOnlyIfHeadless(mainWindow);
  if (liveReload) {
    expect(await mainWindow.evaluate(window => window.webContents.isDevToolsOpened())).toBe(false);
  }
  if (resize) await mainWindow.evaluate((window, { visual, compact }) => {
    if (visual) {
      window.setContentSize(1200, 800);
      return;
    }
    const { screen } = globalThis.__plmTestRequire('electron');
    const area = screen.getDisplayMatching(window.getBounds()).workArea;
    const [outerWidth, outerHeight] = window.getSize();
    const [contentWidth, contentHeight] = window.getContentSize();
    const frameWidth = outerWidth - contentWidth;
    const frameHeight = outerHeight - contentHeight;
    // Native pointer events must remain inside the runner's physical display.
    window.setBounds({ x: area.x + 20, y: area.y + 20,
      width: Math.min((compact ? 960 : 1200) + frameWidth, area.width - 40),
      height: Math.min((compact ? 600 : 800) + frameHeight, area.height - 40) });
  }, { visual, compact: process.env.PLM_E2E_COMPACT === '1' });
  await page.waitForSelector('app-root app-home').catch(async error => {
    // TL;DR: Says why the app did not start: whether its page got its bridge to the main process, how far its
    // start came, which requests it still waits for, and what it threw.
    // Details: On Windows in CI, the home view did not render within 30 seconds for several launches in a row,
    // twice in one evening, with a bridge and without an error, while the same commit passed in the other run. The
    // marks tell a start that waits (renderer:bootstrap-start without renderer:bootstrap-done) from a page that
    // did not come that far, and the requests tell what it waits for, or what it asked for in vain.
    const bridge = await within5Seconds(page.evaluate(() => !window.plm ? 'no bridge' : window.plm.startup === null
      ? 'the startup metadata was refused' : 'a bridge').catch(() => 'unknown'), 'a page that does not answer');
    const marks = await within5Seconds(page.evaluate(() => performance.getEntriesByType('mark')
      .filter(mark => mark.name.startsWith('plm:')).map(mark => mark.name.slice(4))).catch(() => 'unknown'), 'unknown');
    throw new Error(`The home view did not render, with ${bridge}; marks: ${JSON.stringify(marks)}; `
      + `requests not finished: ${JSON.stringify([...unfinishedRequests].map(addressOf))}; `
      + `requests that failed: ${JSON.stringify(failedRequests.slice(-10))}; page errors: ${JSON.stringify(pageErrors)}.`, { cause: error });
  });
  if (liveReload) expect(new URL(page.url()).origin).toBe('http://localhost:4200');
  await page.waitForFunction(() => !!window.plmInternalRenderer?.settingsDialog?.showSettingsDialog);
  await expect(page.locator('.leaflet-pm-toolbar').first()).toBeVisible();
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll('img.leaflet-tile')];
    return tiles.length > 0 && tiles.every(img => img.complete);
  });
  if (languageDialog === 'confirm') await confirmLanguageDialog();
}
/** Clicks OK in the Language dialog, which a profile shows until its user has confirmed a language. */
async function confirmLanguageDialog() {
  const confirmed = await page.evaluate(() => window.plm.storage.snapshot()['History/ClickedOkOnLanguageDialog'] === 'true');
  if (confirmed) return;
  const dialog = page.locator('app-language-dialog');
  await dialog.locator('.ok-button').click();
  await expect(dialog).toHaveCount(0);
}
/** Closes the application and launches it again on an empty profile, as at its first launch on a computer. */
async function launchAsNew(options) {
  await app.close();
  await rm(profile, { recursive: true, force: true });
  await mkdir(profile);
  await launch({ languageDialog: 'keep', ...options });
}
/** The labels of the application menu: each menu with the items of its submenu, and of theirs, without separators. */
function menuLabels() {
  return app.evaluate(({ Menu }) => {
    const labels = items => items.filter(item => item.type !== 'separator')
      .flatMap(item => [item.label, ...(item.role === 'services' || !item.submenu ? [] : labels(item.submenu.items))]);
    return Menu.getApplicationMenu().items.map(menu => ({ label: menu.label, items: labels(menu.submenu.items) }));
  });
}
/**
 * With PLM_VISUAL=1, compares a screenshot with the reference `${name}.png`: of the dialog for welcome, about, the
 * Language dialog and the settings tabs, and of the whole window otherwise, with `mask` over what differs from run to
 * run. empty-home also compares the two toolbars, which the negative controls move.
 */
async function shot(name, mask = []) {
  if (!visual) return;
  await page.evaluate(() => document.fonts.ready);
  if (process.env.PLM_NEGATIVE_CONTROL === '1' && name === 'empty-home') {
    await page.locator('.open-folder-button').evaluate(el => el.style.transform = 'translateX(20px)');
  }
  if (process.env.PLM_MAP_NEGATIVE_CONTROL === '1' && name === 'empty-home') {
    await page.locator('.leaflet-pm-toolbar').first().evaluate(el => el.style.transform = 'translateX(-3px)');
  }
  if (name === 'empty-home') {
    await expect(page.locator('app-sidebar-upper-pane')).toHaveScreenshot('toolbar.png', { animations: 'disabled' });
    // Reference pixels are cropped from the original full-page screenshot.
    await expect(page).toHaveScreenshot('map-toolbar.png', { clip: { x: 1155, y: 210, width: 36, height: 185 } });
  }
  const isDialog = /^(welcome|about|language-dialog|settings-)/.test(name);
  const dialog = isDialog ? page.locator('mat-dialog-container') : page;
  // TL;DR: A dialog's screenshot waits until no other dialog is left, as toHaveScreenshot passes without comparing
  // when its locator matches two elements.
  // Details: settings-appearance is taken right after the settings dialog opens, while the about box is still closing,
  // so the locator matched both. Playwright 1.64.1 then took no screenshot, lost the strict mode violation and
  // passed: the case passed with the welcome dialog's image as settings-appearance.png, three times out of three,
  // while a wrong welcome, about, settings-date or settings-cache image failed it. Without a reference, as with
  // --update-snapshots, it failed with "The "data" argument must be of type string or an instance of Buffer".
  if (isDialog) await expect(dialog).toHaveCount(1);
  await expect(dialog).toHaveScreenshot(`${name}.png`, { mask });
}
async function dismissWelcome() {
  if (await page.locator('app-welcome-dialog').count()) {
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.locator('app-welcome-dialog')).toHaveCount(0);
  }
}
async function expectRepresentedPhotos(count) {
  // Cluster membership changes with available map space; the photo total must not.
  await expect.poll(async () => await page.locator('.plm-leaflet-map-div-icon').count() +
    await page.locator('.marker-cluster span').evaluateAll(nodes => nodes.reduce((sum, node) => sum + Number(node.textContent), 0))).toBe(count);
}
/** Opens the Settings dialog, which opens on its Language tab, and shows the tab named `tab` if one is given. */
async function settings(tab) {
  await page.evaluate(() => window.plmInternalRenderer.settingsDialog.showSettingsDialog());
  await expect(page.locator('app-settings-dialog')).toBeVisible();
  if (tab) await page.locator('app-settings-dialog mat-list-item').filter({ hasText: tab }).click();
}
/**
 * The application's question before a restart, which it asks in a dialog of its own: checks its lines, then clicks
 * `answer`, OK or Cancel.
 */
async function answerConfirmation(lines, answer) {
  const confirmation = page.locator('app-confirm-dialog');
  await expect(confirmation.locator('.message')).toHaveText(lines.join('\n'), { useInnerText: true });
  await confirmation.getByRole('button', { name: answer, exact: true }).click();
  await expect(confirmation).toHaveCount(0);
}
async function openFolderWithPicker(folder) {
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, folder);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
}
function treeCheckbox(name) {
  return page.locator('mat-tree-node').filter({ hasText: name }).getByRole('checkbox');
}
/** Records the URLs that the main process opens in the OS browser for the page, instead of opening them. */
async function recordOpenedUrls() {
  await app.evaluate(({ shell }) => {
    globalThis.__plmOpenedUrls = [];
    shell.openExternal = async url => { globalThis.__plmOpenedUrls.push(url); };
  });
  return () => app.evaluate(() => globalThis.__plmOpenedUrls);
}
/** Records the commands that the main process runs to open files and folders with the OS, instead of running them. */
async function recordOpenCommands() {
  await app.evaluate(() => {
    globalThis.__plmOpenCommands = [];
    globalThis.__plmTestRequire('child_process').spawn = (file, args) => {
      globalThis.__plmOpenCommands.push({ file, args });
      return { on() {} };
    };
    // The app reads spawn from child_process's ES module, whose exports follow the CommonJS module's once synced.
    globalThis.__plmTestRequire('node:module').syncBuiltinESMExports();
  });
  return () => app.evaluate(() => globalThis.__plmOpenCommands);
}
/** The command that opens `filePath`, or its folder, with the OS: without a shell (src-main/shell/open-with-os.ts). */
function osOpenCommand(filePath, { containingFolder = false } = {}) {
  if (process.platform === 'win32') return { file: 'explorer', args: [containingFolder ? `/select,"${filePath}"` : `"${filePath}"`] };
  if (process.platform === 'darwin') return { file: 'open', args: containingFolder ? ['-R', filePath] : [filePath] };
  return { file: containingFolder ? 'nautilus' : 'xdg-open', args: [filePath] };
}
test.beforeEach(async () => {
  if (packagedExecutable) test.setTimeout(120000);
  if (process.env.PLM_REQUIRE_ORIGINAL_STACK === '1' && test.info().config.updateSnapshots !== 'none') {
    expect(require('../../node_modules/@angular/core/package.json').version).toBe('18.2.4');
    expect(require('../../node_modules/electron/package.json').version).toBe('32.0.2');
  }
  profile = await mkdtemp(path.join(tmpdir(), 'plm-e2e-'));
  changedWithoutNotification = [];
  await launch();
});
/** The promise's value, or `otherwise` when it has none within 5 seconds: a process that hangs does not answer. */
function within5Seconds(promise, otherwise) {
  let timer;
  return Promise.race([promise, new Promise(resolve => { timer = setTimeout(() => resolve(otherwise), 5000); })])
    .finally(() => clearTimeout(timer));
}
/**
 * What the application was doing, for a case that timed out: whether its main process and each of its pages still
 * answer, and what each window was loading.
 * TL;DR: A case that times out says only that it did, and which step it was in, when that step has no time limit of
 * its own, is not known: a call into the application waits as long as the application takes.
 * Details: The first case of Photo Data Viewer with a HEIC photo timed out on macOS in CI twice in one evening, and
 * so did the hook that closes the application after it, while the same commit passed in the other run. Its log
 * could not tell a page of the viewer that did not load from an application that hung.
 */
async function describeApplication() {
  const unanswered = 'no answer within 5 seconds';
  const failed = error => `failed: ${error.message}`;
  const lines = [];
  const windows = await within5Seconds(app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(window => ({
    title: window.getTitle(),
    url: window.webContents.getURL(),
    loading: window.webContents.isLoading(),
    waitingForResponse: window.webContents.isWaitingForResponse(),
    crashed: window.webContents.isCrashed(),
  }))).catch(failed), unanswered);
  lines.push(`main process: ${typeof windows === 'string' ? windows : `answers, with ${windows.length} windows`}`);
  if (typeof windows !== 'string') lines.push(...windows.map(window => `window: ${JSON.stringify(window)}`));
  for (const openPage of app.windows()) {
    const state = await within5Seconds(openPage.evaluate(() => `answers, ${document.readyState}`).catch(failed), unanswered);
    lines.push(`page ${openPage.url()}: ${state}`);
  }
  return lines.join('\n');
}
/**
 * Removes a case's profile.
 * TL;DR: The removal is tried again for ten seconds while Windows still holds the folder.
 * Details: On Windows in CI, three runs in one evening had a case that failed with "EBUSY: resource busy or locked,
 * rmdir <profile>" and nothing else, each in a stretch of a few minutes in which the launches around it took several
 * times as long as usual, while the same commit passed in the run of the other trigger. The application's other
 * processes, as the page's, end a moment after its main process, and hold the folder until then. The whole removal
 * is tried again, within one limit: fs.rm's own maxRetries tries each file and folder again by itself, which can add
 * up to more than the hook's time. Any other error, and a folder that is still held after ten seconds, fails the
 * case, as before.
 */
async function removeProfile(folder) {
  const deadline = Date.now() + 10000;
  for (;;) {
    try {
      await rm(folder, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error.code !== 'EBUSY' || Date.now() >= deadline) throw error;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
}
// Playwright reads the names of the fixtures from the first parameter, which has to be written as a pattern.
test.afterEach(async ({}, testInfo) => {
  const child = app?.process();
  let timer;
  try {
    if (app && testInfo.status === 'timedOut') {
      const state = await describeApplication().catch(error => `could not be read: ${error.message}`);
      console.log(`The case timed out. The application then:\n${state}`);
      await testInfo.attach('application-state', { body: state, contentType: 'text/plain' });
    }
    // A development build checks every view each second (src/app/app.config.ts): let one more check run, after the
    // case's last step, before the application closes. A page that hangs does not hold the hook up.
    if (page && !page.isClosed() && await within5Seconds(page.evaluate(() => !!globalThis.ngDevMode).catch(() => false), false))
      await page.waitForTimeout(1100);
    if (app) await Promise.race([
      app.close(),
      new Promise((_, reject) => timer = setTimeout(() => reject(new Error('Test application did not quit within 10 seconds.')), 10000)),
    ]);
  } finally {
    clearTimeout(timer);
    if (child && child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGKILL');
      await stopped;
    }
    if (profile) await removeProfile(profile);
  }
  expect(changedWithoutNotification, 'Bindings changed without telling Angular').toEqual([]);
});
test('welcome, about and every available settings tab keep their appearance', async () => {
  await expect(page.locator('app-welcome-dialog')).toContainText(`Version ${manifest.version}`);
  const paths = await app.evaluate(({ app }) => [app.getPath('appData'), app.getPath('userData')]);
  expect(paths.every(p => p.startsWith(profile + path.sep))).toBe(true);
  await shot('welcome');
  await dismissWelcome();
  await shot('empty-home');
  await page.evaluate(() => window.plmInternalRenderer.aboutBox.showAboutBox());
  await expect(page.locator('app-about-box')).toBeVisible();
  await shot('about');
  await page.keyboard.press('Escape');
  await settings();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await expect(page.locator('app-settings-dialog mat-list-item').first()).toHaveText('Language');
  await expect(page.locator('app-language-settings')).toBeVisible();
  await shot('settings-language');
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Appearance' }).click();
  await shot('settings-appearance');
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
  await shot('settings-date', [page.locator('.date-time-example')]);
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Cache' }).click();
  await shot('settings-cache', [page.locator('.location-value')]);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
});
// The application menu in English, as it was when Electron gave the labels of the items with a role, and in Japanese.
const isMac = process.platform === 'darwin';
// The entry of the Language list that follows the operating system's language names macOS and Windows.
const operatingSystemName = { darwin: 'macOS', win32: 'Windows' }[process.platform];
const systemLanguageInEnglish = language => `Use ${operatingSystemName ?? 'system'} setting (${language})`;
const systemLanguageInJapanese = language => `${operatingSystemName ?? 'OS'} の設定に従う（${language}）`;
// The languages of the application under their own names, in the order of the list: those in Latin letters by the
// alphabet, then those in other scripts.
const languageNames = [
  'Bahasa Indonesia', 'Bahasa Melayu', 'Català', 'Čeština', 'Dansk', 'Deutsch', 'Eesti', 'English', 'Español', 'Euskara',
  'Français', 'Galego', 'Hrvatski', 'Italiano', 'Latviešu', 'Lietuvių', 'Magyar', 'Nederlands', 'Norsk bokmål', 'Polski',
  'Português (Brasil)', 'Português (Portugal)', 'Română', 'Slovenčina', 'Slovenščina', 'Srpski (latinica)', 'Suomi', 'Svenska',
  'Tiếng Việt', 'Türkçe', 'Ελληνικά', 'Български', 'Русский', 'Українська', 'עברית', 'العربية', 'हिन्दी', 'ไทย', '한국어', '日本語',
  '简体中文', '繁體中文',
];
const menuInEnglish = [
  ...(isMac ? [{
    // macOS shows the application's name instead of this label.
    label: 'The name of the first menu item is the application name on macOS',
    items: ['About Photo Location Map', 'Services', 'Hide Photo Location Map', 'Hide Others', 'Show All', 'Quit Photo Location Map'],
  }] : []),
  { label: 'View', items: ['Reload', 'Actual Size', 'Zoom In', 'Zoom Out', 'Toggle Full Screen'] },
  { label: 'Selection', items: ['Undo', 'Redo'] },
  { label: 'Settings', items: ['Open Settings'] },
  { label: 'Help', items: [...(isMac ? [] : ['About Photo Location Map']),
    'Show Welcome Dialog', 'Advanced Menu', 'Open Log Folder', 'Toggle Developer Tools'] },
];
const menuInJapanese = [
  ...(isMac ? [{
    label: 'The name of the first menu item is the application name on macOS',
    items: ['Photo Location Map について', 'サービス', 'Photo Location Map を非表示', 'ほかを非表示', 'すべてを表示', 'Photo Location Map を終了'],
  }] : []),
  { label: '表示', items: ['再読み込み', '実際のサイズ', '拡大', '縮小', 'フルスクリーンの切り替え'] },
  { label: '選択', items: ['元に戻す', 'やり直す'] },
  { label: '設定', items: ['設定を開く'] },
  { label: 'ヘルプ', items: [...(isMac ? [] : ['Photo Location Map について']),
    '「ようこそダイアログ」を表示', '詳細メニュー', 'ログフォルダーを開く', '開発者ツールの切り替え'] },
];
test('the Language dialog comes before the Welcome dialog at the first launch, and not again once a language is confirmed', async () => {
  await launchAsNew();
  const dialog = page.locator('app-language-dialog');
  await expect(dialog).toBeVisible();
  // The Welcome dialog waits: its messages are to be read in the language that the user chooses.
  await expect(page.locator('app-welcome-dialog')).toHaveCount(0);
  await expect(dialog.locator('.language-dialog-title')).toHaveText('Language');
  // A list like the one in the setup of macOS: the operating system's language, which a test profile gives as
  // English and which is chosen, then each language under its own name.
  const options = dialog.getByRole('listbox', { name: 'Language' }).getByRole('option');
  await expect(options).toHaveText([systemLanguageInEnglish('English'), ...languageNames]);
  const systemLanguage = dialog.getByRole('option', { name: systemLanguageInEnglish('English'), exact: true });
  const korean = dialog.getByRole('option', { name: '한국어', exact: true });
  const japanese = dialog.getByRole('option', { name: '日本語', exact: true });
  await expect(systemLanguage).toHaveAttribute('aria-selected', 'true');
  // The dialog opens with the search field ready to be typed in.
  const search = dialog.getByRole('searchbox', { name: 'Search' });
  await expect(search).toBeFocused();
  // A magnifying glass at the end of the field, as search fields usually have: 8 pixels from its right edge, in the
  // middle of its height. A click on it goes to the field under it.
  const searchBox = await search.boundingBox();
  const magnifier = await dialog.locator('.search-icon').boundingBox();
  expect(searchBox.x + searchBox.width - (magnifier.x + magnifier.width)).toBeCloseTo(8, 0);
  expect(magnifier.y + magnifier.height / 2).toBeCloseTo(searchBox.y + searchBox.height / 2, 0);
  await dialog.locator('.ok-button').focus();
  await page.mouse.click(magnifier.x + magnifier.width / 2, magnifier.y + magnifier.height / 2);
  await expect(search).toBeFocused();
  const okButton = dialog.locator('.ok-button');
  await expect(okButton).toHaveText('OK');
  const restartNote = dialog.locator('.restart-note');
  await expect(restartNote).toBeHidden();
  await shot('language-dialog');
  // With more entries than the box shows, the list scrolls, and its scrollbar takes room in the box, so it stays in
  // view, where the one of macOS would hide.
  const box = await dialog.locator('.languages').evaluate(list => ({ entries: list.children.length,
    content: list.scrollHeight, shown: list.clientHeight, scrollbar: list.offsetWidth - list.clientWidth }));
  expect(box).toEqual({ entries: 43, content: 43 * 32, shown: 7 * 32, scrollbar: 12 });
  // The search field narrows the list down to what is typed: by a language's own name, by its English name, without
  // regard to case or diacritics. The dialog keeps its size, and so its place, while the list gets shorter.
  const dialogSize = async () => { const { width, height } = await dialog.boundingBox(); return { width, height }; };
  const sizeWithEveryLanguage = await dialogSize();
  await search.fill('日本');
  await expect(options).toHaveText(['日本語']);
  await search.fill('CESTINA');
  await expect(options).toHaveText(['Čeština']);
  await search.fill('portuguese');
  await expect(options).toHaveText(['Português (Brasil)', 'Português (Portugal)']);
  expect(await dialogSize()).toEqual(sizeWithEveryLanguage);
  await search.fill('no such language');
  await expect(options).toHaveCount(0);
  await expect(dialog.getByRole('status')).toHaveText('No languages found');
  expect(await dialogSize()).toEqual(sizeWithEveryLanguage);
  // The chosen entry, which the search hid, is still the chosen one, and in view, once the search is cleared.
  await search.fill('');
  await expect(options).toHaveCount(43);
  await expect(dialog.getByRole('status')).toHaveText('');
  await expect(systemLanguage).toHaveAttribute('aria-selected', 'true');
  await expect(systemLanguage).toBeInViewport();
  // Another language than the one on screen needs a restart, which the dialog says in that language, as its button is.
  await japanese.click();
  await expect(japanese).toHaveAttribute('aria-selected', 'true');
  await expect(systemLanguage).toHaveAttribute('aria-selected', 'false');
  await expect(restartNote).toBeVisible();
  await expect(restartNote).toHaveText('言語を適用するため、このアプリを再起動します。');
  await expect(okButton).toHaveText('決定');
  // The keyboard chooses as well: the arrow keys move along the list, and Space chooses the language under them.
  await page.keyboard.press('ArrowUp');
  await expect(korean).toBeFocused();
  await expect(japanese).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Space');
  await expect(korean).toHaveAttribute('aria-selected', 'true');
  await expect(restartNote).toHaveText('언어를 적용하기 위해 이 앱을 다시 시작합니다.');
  await expect(okButton).toHaveText('확인');
  // The language on screen, found by the search and chosen by its name, needs no restart.
  await search.fill('english');
  await expect(options).toHaveText([systemLanguageInEnglish('English'), 'English']);
  await dialog.getByRole('option', { name: 'English', exact: true }).click();
  await expect(restartNote).toBeHidden();
  await expect(okButton).toHaveText('OK');
  await search.fill('');
  await systemLanguage.click();
  await expect(systemLanguage).toHaveAttribute('aria-selected', 'true');
  await okButton.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('app-welcome-dialog')).toContainText('Welcome to Photo Location Map');
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  expect(await menuLabels()).toEqual(menuInEnglish);
  const userData = await app.evaluate(({ app }) => app.getPath('userData'));
  await expect.poll(() => savedSetting(userData, ['History', 'ClickedOkOnLanguageDialog'])).toBe('true');
  await expect.poll(() => savedSetting(userData, ['UserSettings', 'Language'])).toBe('auto');
  // At the next launch, the Welcome dialog is shown at once, as its OK was not clicked.
  await app.close();
  await launch({ languageDialog: 'keep' });
  await expect(page.locator('app-welcome-dialog')).toBeVisible();
  await expect(page.locator('app-language-dialog')).toHaveCount(0);
});
test('a language chosen in the Language dialog, and another chosen later in the Settings dialog, each restart the application in it', async () => {
  const report = path.join(profile, 'launches.jsonl');
  await launchAsNew({ env: { PLM_TEST_LAUNCH_REPORT: report } });
  const userData = await app.evaluate(({ app }) => app.getPath('userData'));
  // Japanese, chosen in the Language dialog of an application in English: its button restarts the application.
  const dialog = page.locator('app-language-dialog');
  await dialog.getByRole('option', { name: '日本語', exact: true }).click();
  let pid = await mainProcessId();
  let exited = new Promise(resolve => app.process().once('exit', resolve));
  await dialog.getByRole('button', { name: '決定', exact: true }).click();
  await waitForRealRelaunch(report, exited, pid);
  expect(await savedSetting(userData, ['UserSettings', 'Language'])).toBe('ja');
  expect(await savedSetting(userData, ['History', 'ClickedOkOnLanguageDialog'])).toBe('true');
  // The application is in Japanese, and goes on to the Welcome dialog without asking for the language again. The
  // second restart gets a launch report of its own, as waitForRealRelaunch takes the first other process of a report.
  const secondReport = path.join(profile, 'launches-2.jsonl');
  await launch({ env: { PLM_TEST_LAUNCH_REPORT: secondReport }, languageDialog: 'keep' });
  await expect(page.locator('app-language-dialog')).toHaveCount(0);
  await expect(page.locator('app-welcome-dialog')).toContainText('Photo Location Map へようこそ');
  await dismissWelcome();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('ja');
  expect(await menuLabels()).toEqual(menuInJapanese);
  // English, chosen in the Settings dialog, which opens on its Language tab: Save asks, then restarts the application.
  await settings();
  const languageSettings = page.locator('app-language-settings');
  await expect(languageSettings.getByRole('option')).toHaveText([systemLanguageInJapanese('English'), ...languageNames]);
  await expect(languageSettings.getByRole('option', { name: '日本語', exact: true })).toHaveAttribute('aria-selected', 'true');
  // The list opens where the chosen language is, far down the list.
  await expect(languageSettings.getByRole('option', { name: '日本語', exact: true })).toBeInViewport();
  // The search finds a language by its name in the application's language as well: ドイツ語 is German in Japanese.
  const languageSearch = languageSettings.getByRole('searchbox', { name: '検索' });
  await languageSearch.fill('ドイツ');
  await expect(languageSettings.getByRole('option')).toHaveText(['Deutsch']);
  await languageSearch.fill('見つからない言語');
  await expect(languageSettings.getByRole('status')).toHaveText('言語が見つかりません');
  await languageSearch.fill('engl');
  await expect(languageSettings.getByRole('option')).toHaveText([systemLanguageInJapanese('English'), 'English']);
  const save = page.getByRole('button', { name: '保存', exact: true });
  const restartNotice = page.locator('app-settings-dialog').getByText('設定を保存すると、このアプリは再起動します。');
  await expect(save).toBeDisabled();
  await expect(restartNotice).toBeHidden();
  await languageSettings.getByRole('option', { name: 'English', exact: true }).click();
  await expect(save).toBeEnabled();
  await expect(restartNotice).toBeVisible();
  await save.click();
  // Declined, nothing is saved and the dialog stays.
  await answerConfirmation(['設定を保存すると、このアプリは再起動します。', '続けますか？'], 'キャンセル');
  await expect(page.locator('app-settings-dialog')).toBeVisible();
  expect(await savedSetting(userData, ['UserSettings', 'Language'])).toBe('ja');
  pid = await mainProcessId();
  exited = new Promise(resolve => app.process().once('exit', resolve));
  await save.click();
  await page.locator('app-confirm-dialog').getByRole('button', { name: 'OK', exact: true }).click();
  await waitForRealRelaunch(secondReport, exited, pid);
  expect(await savedSetting(userData, ['UserSettings', 'Language'])).toBe('en');
  await launch();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
  expect(await menuLabels()).toEqual(menuInEnglish);
  await expect(page.getByRole('button', { name: 'Open Folder', exact: true })).toBeVisible();
});
test('on a computer whose language is Japanese, the application is in Japanese: its dialogs, menu, map, dates and viewer', async () => {
  // The operating system's languages, the most preferred first, as macOS and Windows give them.
  await launchAsNew({ env: { PLM_TEST_SYSTEM_LANGUAGES: 'ja-JP,en-US' } });
  const languageDialog = page.locator('app-language-dialog');
  await expect(languageDialog.locator('.language-dialog-title')).toHaveText('言語 (Language)');
  await expect(languageDialog.getByRole('option')).toHaveText([systemLanguageInJapanese('日本語'), ...languageNames]);
  await expect(languageDialog.getByRole('option', { name: systemLanguageInJapanese('日本語') })).toHaveAttribute('aria-selected', 'true');
  await expect(languageDialog.locator('.restart-note')).toBeHidden();
  await shot('language-dialog-ja');
  // The button is named as Japanese names it, not "OK".
  await languageDialog.getByRole('button', { name: '決定', exact: true }).click();
  const welcome = page.locator('app-welcome-dialog');
  await expect(welcome).toContainText('Photo Location Map へようこそ');
  await expect(welcome).toContainText(`バージョン ${manifest.version}`);
  await expect(welcome.locator('.troubleshooting-message a')).toHaveText('トラブルシューティングのページ');
  await shot('welcome-ja');
  await dismissWelcome();
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('ja');
  expect(await menuLabels()).toEqual(menuInJapanese);
  // The home view, with the tooltips of the map's controls: the application's, Leaflet's and Leaflet-Geoman's.
  await expect(page.locator('.message-when-folder-is-not-opened')).toHaveText('フォルダーを開くと、写真の撮影場所が表示されます。');
  await expect(page.getByTitle('長方形で範囲を指定', { exact: true })).toBeVisible();
  await expect(page.locator('.leaflet-control-zoom-in')).toHaveAttribute('title', '拡大');
  await expect(page.locator('.leaflet-control-layers-toggle')).toHaveAttribute('title', 'レイヤー');
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, photoFolder);
  await page.getByRole('button', { name: 'フォルダーを開く', exact: true }).click();
  const statusBar = page.locator('app-loaded-files-status-bar');
  await expect(statusBar).toContainText('5 個のファイルを読み込みました。');
  await expect(statusBar).toContainText('4 個のファイルに位置情報があります。');
  await expect(statusBar).toContainText('合計: 5');
  // A date writes the day of the week as Japanese does, in parentheses, from moment's Japanese locale.
  await expectRepresentedPhotos(4);
  await page.locator('.plm-leaflet-map-div-icon').first().dispatchEvent('click');
  const popup = page.locator('.leaflet-popup');
  await expect(popup.locator('.photo-info-viewer-date-time-taken')).toHaveText(/^\d{4}-\d{2}-\d{2} \([日月火水木金土]\) \d{2}:\d{2}:\d{2}$/);
  await popup.locator('.photo-info-viewer-more-options-button').click();
  await expect(page.locator('.photo-info-viewer-more-options-menu-item'))
    .toHaveText(['このファイルのみを選択', 'フォルダーを開く', 'Google マップを開く', 'Google ストリートビューを開く', 'データを表示']);
  // The menu is wider than in English, and this popup is at the map's left edge: the menu is not cut off there.
  const menuBox = await page.locator('.photo-info-viewer-more-options-menu').boundingBox();
  const mapBox = await page.locator('#home-map').boundingBox();
  expect(menuBox.x).toBeGreaterThanOrEqual(mapBox.x);
  await page.keyboard.press('Escape');
  // The tree's menu names what it is opened on, a folder or a file, where English says "Select Only This" of both.
  const treeMenuItems = page.getByRole('menuitem');
  const appleParkFolder = page.locator('mat-tree-node').filter({ hasText: 'Apple Park' });
  await appleParkFolder.click({ button: 'right' });
  await expect(treeMenuItems).toHaveText(['このフォルダーのみを選択', '開く', 'フォルダーを開く']);
  await page.keyboard.press('Escape');
  await expect(treeMenuItems).toHaveCount(0);
  await appleParkFolder.locator('button[mattreenodetoggle]').click();
  await page.locator('mat-tree-node').filter({ hasText: 'IMG_5769.JPG' }).click({ button: 'right' });
  await expect(treeMenuItems).toHaveText(['このファイルのみを選択', '開く', 'フォルダーを開く']);
  await page.keyboard.press('Escape');
  await expect(treeMenuItems).toHaveCount(0);
  // Photo Data Viewer is asked for the same language in its address, next to the date format.
  const viewerUrl = await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    const viewer = require(require('node:path').join(app.getAppPath(), 'out/app/src-main/photo-data-viewer/photo-data-viewer-url.js'));
    return viewer.createPhotoDataViewerUrl({ name: 'photo.jpg', path: '/photos/photo.jpg' });
  });
  expect(new URL(viewerUrl).searchParams.get('language')).toBe('ja');
  // The Settings dialog, whose first tab keeps the English word for a user who cannot read Japanese.
  await settings();
  await expect(page.locator('app-settings-dialog mat-list-item')).toHaveText(
    ['言語 (Language)', '外観', '日付と時刻', ...(process.platform === 'win32' ? ['OS'] : []), 'キャッシュ']);
  const languageSettings = page.locator('app-language-settings');
  await expect(languageSettings.getByRole('option')).toHaveText([systemLanguageInJapanese('日本語'), ...languageNames]);
  await expect(languageSettings.getByRole('option', { name: systemLanguageInJapanese('日本語') })).toHaveAttribute('aria-selected', 'true');
  await shot('settings-language-ja');
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: '日付と時刻' }).click();
  await page.getByRole('combobox', { name: '12/24 時間制' }).click();
  await page.getByRole('option', { name: '12 時間制', exact: true }).click();
  await expect(page.locator('.date-time-example')).toContainText('2019-11-25 02:53:29 午後');
  await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
});
test('on a computer whose language is Arabic, the application is laid out from right to left', async () => {
  // The one language written from right to left that is run here; Hebrew is laid out by the same rules.
  await launchAsNew({ env: { PLM_TEST_SYSTEM_LANGUAGES: 'ar-SA,en-US' } });
  expect(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir])).toEqual(['ar', 'rtl']);
  const languageDialog = page.locator('app-language-dialog');
  await expect(languageDialog.locator('.language-dialog-title')).toHaveText('اللغة (Language)');
  // The name of the language that the first entry stands for is a value of its text: it is on its own there, between
  // U+2068 and U+2069, so that a name written the other way, such as English, keeps its parentheses around it.
  await expect(languageDialog.getByRole('option').first())
    .toHaveText(`استخدام إعداد ${operatingSystemName ?? 'النظام'} (\u2068العربية\u2069)`);
  // The magnifying glass of the search field is at its end, where a line ends: at its left.
  const searchBox = await languageDialog.getByRole('searchbox').boundingBox();
  const magnifier = await languageDialog.locator('.search-icon').boundingBox();
  expect(magnifier.x - searchBox.x).toBeCloseTo(8, 0);
  await languageDialog.getByRole('button', { name: 'موافق', exact: true }).click();
  const welcome = page.locator('app-welcome-dialog');
  // The application's name is a value of the heading, so that it stays on one line: as any value in a text
  // written from right to left, it is between U+2068 and U+2069.
  await expect(welcome).toContainText('مرحبًا بك في \u2068Photo Location Map\u2069');
  await welcome.getByRole('button', { name: 'موافق', exact: true }).click();
  await expect(welcome).toHaveCount(0);
  // The sidebar is at the right of the map, and the border between them follows the mouse there as well.
  const sidebar = page.locator('#home-left-sidebar');
  const map = page.locator('#home-map');
  const sidebarAtStart = await sidebar.boundingBox();
  const mapAtStart = await map.boundingBox();
  expect(sidebarAtStart.x).toBeGreaterThanOrEqual(mapAtStart.x + mapAtStart.width);
  const gutter = await page.locator('.sidebar-and-map-container > .gutter-horizontal').boundingBox();
  await page.mouse.move(gutter.x + gutter.width / 2, gutter.y + 100);
  await page.mouse.down();
  await page.mouse.move(gutter.x + gutter.width / 2 - 120, gutter.y + 100, { steps: 8 });
  await page.mouse.up();
  const sidebarAfterDrag = await sidebar.boundingBox();
  expect(Math.abs(sidebarAfterDrag.width - sidebarAtStart.width - 120)).toBeLessThan(3);
  expect(Math.abs(sidebarAfterDrag.x - (sidebarAtStart.x - 120))).toBeLessThan(3);
  // A folder of photos: the status bar, the tree and the map, which itself stays laid out from left to right.
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, photoFolder);
  await page.getByRole('button', { name: 'فتح مجلد', exact: true }).click();
  await expectRepresentedPhotos(4);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('الملفات المحمَّلة: \u20685\u2069.');
  await expect(page.locator('#plm-leaflet-map')).toHaveCSS('direction', 'ltr');
  await expect(page.locator('app-date-time-taken-chart')).toHaveCSS('direction', 'ltr');
  await expect(page.locator('app-date-time-taken-chart canvas')).toBeVisible();
  await shot('loaded-home-ar');
  // A date has the day of the week in Arabic, from moment's locale, and the digits 0 to 9.
  await page.locator('.plm-leaflet-map-div-icon').first().dispatchEvent('click');
  const popup = page.locator('.leaflet-popup');
  await expect(popup.locator('.leaflet-popup-content')).toHaveCSS('direction', 'rtl');
  await expect(popup.locator('.photo-info-viewer-date-time-taken')).toHaveText(/^\d{4}-\d{2}-\d{2} [\u0621-\u064A]+ \d{2}:\d{2}:\d{2}$/);
  // The photo's menu opens the other way round, and stays within the map.
  await popup.locator('.photo-info-viewer-more-options-button').click();
  await expect(page.locator('.photo-info-viewer-more-options-menu-item'))
    .toHaveText(['تحديد هذا الملف فقط', 'فتح المجلد', 'فتح خرائط Google', 'فتح Google Street View', 'عرض البيانات']);
  const menuBox = await page.locator('.photo-info-viewer-more-options-menu').boundingBox();
  const mapBox = await map.boundingBox();
  expect(menuBox.x).toBeGreaterThanOrEqual(mapBox.x);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(mapBox.x + mapBox.width);
  await page.keyboard.press('Escape');
  // A path is written from left to right within the text around it: its first slash stays at its start.
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'ذاكرة التخزين المؤقت' }).click();
  const cacheLocation = page.locator('app-cache-settings .location-value bdi');
  await expect(cacheLocation).toHaveText(/thumbnail-cache$/);
  await expect(cacheLocation).toHaveCSS('direction', 'ltr');
  await page.getByRole('button', { name: 'إلغاء', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  expect(await menuLabels()).toEqual([
    ...(isMac ? [{
      label: 'The name of the first menu item is the application name on macOS',
      items: ['حول Photo Location Map', 'الخدمات', 'إخفاء Photo Location Map', 'إخفاء الأخرى', 'إظهار الكل', 'إنهاء Photo Location Map'],
    }] : []),
    { label: 'عرض', items: ['إعادة التحميل', 'الحجم الفعلي', 'تكبير', 'تصغير', 'تبديل وضع ملء الشاشة'] },
    { label: 'التحديد', items: ['تراجع', 'إعادة'] },
    { label: 'الإعدادات', items: ['فتح الإعدادات'] },
    { label: 'مساعدة', items: [...(isMac ? [] : ['حول Photo Location Map']),
      'إظهار مربع حوار الترحيب', 'القائمة المتقدمة', 'فتح مجلد السجلات', 'إظهار/إخفاء أدوات المطوّرين'] },
  ]);
});
test('map regions preserve drawing, removal and real photo selection', async () => {
  await page.addInitScript(() => {
    let leaflet;
    Object.defineProperty(window, 'L', {
      configurable: true, enumerable: true,
      get: () => leaflet,
      set: lib => {
        leaflet = lib;
        lib?.Map?.addInitHook(function () {
          if (this.getContainer().id !== 'plm-leaflet-map') return;
          window.__plmLeafletMap = this;
          this.on('movestart', () => window.__plmMapMoving = true);
          this.on('moveend', () => window.__plmMapMoving = false);
        });
      }
    });
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__plmLeafletMap?.pm);
  await dismissWelcome();
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, photoFolder);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  await page.waitForFunction(() => !window.__plmMapMoving);
  const titles = await page.locator('.leaflet-pm-toolbar .button-container[title]').evaluateAll(nodes => nodes.map(n => n.title).sort());
  expect(titles).toEqual(['Set Region by Rectangle', 'Set Region by Vertex', 'Set Text', 'Edit Region', 'Drag Region', 'Remove Region'].sort());
  // Focus the same geographic drawing area on small CI displays as well.
  await page.evaluate(() => window.__plmLeafletMap.fitBounds([[-15, 105], [45, 165]], { padding: [80, 80], animate: false }));
  await page.waitForFunction(() => !window.__plmMapMoving);
  const mapBox = await page.locator('#plm-leaflet-map').boundingBox();
  const corners = await page.evaluate(() => [[-10, 110], [40, 160]].map(latlng => {
    const p = window.__plmLeafletMap.latLngToContainerPoint(latlng);
    return { x: p.x, y: p.y };
  }));
  async function drawRectangle() {
    await page.getByTitle('Set Region by Rectangle', { exact: true }).click();
    await page.mouse.click(mapBox.x + corners[0].x, mapBox.y + corners[0].y);
    await page.mouse.move(mapBox.x + corners[1].x, mapBox.y + corners[1].y, { steps: 5 });
    await page.mouse.click(mapBox.x + corners[1].x, mapBox.y + corners[1].y);
    await expect(page.locator('.plm-leaflet-map-region-info-text')).toHaveText('Photos in Regions: 2');
  }
  async function drawPolygon() {
    await page.getByTitle('Set Region by Vertex', { exact: true }).click();
    for (const point of [corners[0], { x: corners[0].x, y: corners[1].y }, corners[1], corners[0]]) {
      await page.mouse.move(mapBox.x + point.x, mapBox.y + point.y, { steps: 5 });
      await page.mouse.click(mapBox.x + point.x, mapBox.y + point.y);
    }
    await expect(page.locator('.plm-leaflet-map-region-info-text')).toHaveText('Photos in Regions: 2');
  }
  await drawRectangle();
  await drawPolygon();
  const shapes = page.locator('#plm-leaflet-map path.leaflet-interactive');
  await expect(shapes).toHaveCount(2);
  await page.getByTitle('Remove Region', { exact: true }).click();
  for (const [index, latlng] of [[-5, 135], [32, 115]].entries()) {
    const inside = await page.evaluate(latlng => {
      const p = window.__plmLeafletMap.latLngToContainerPoint(latlng);
      return { x: p.x, y: p.y };
    }, latlng);
    await page.mouse.click(mapBox.x + inside.x, mapBox.y + inside.y);
    await expect(shapes).toHaveCount(1 - index);
  }
  await expect(page.locator('.plm-leaflet-map-region-info-text')).toBeHidden();
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Gold Coast' }).getByRole('checkbox')).toBeChecked();
  await page.getByTitle('Remove Region', { exact: true }).click();
  await drawPolygon();
  await page.getByRole('button', { name: 'Select Photos', exact: true }).click();
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Kobe' }).getByRole('checkbox')).toBeChecked();
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Unga' }).getByRole('checkbox')).toBeChecked();
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Gold Coast' }).getByRole('checkbox')).not.toBeChecked();
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Apple Park' }).getByRole('checkbox')).not.toBeChecked();
  await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(2);
  await expect(page.locator('app-leaflet-map .update-in-progress-overlay')).toBeHidden();
  await expect(page.locator('.marker-cluster')).toHaveCount(0);
  await expect(page.locator('.plm-leaflet-map-region-info-text')).toBeHidden();
});
test('the links of the welcome dialog, the about box and the cache settings open in the OS browser', async () => {
  // Some of them are elements that the components query, with signal queries since stage 2. Nothing opens here.
  const openedUrls = await recordOpenedUrls();
  const welcome = page.locator('app-welcome-dialog');
  await welcome.getByText('the troubleshooting page').click();
  await welcome.getByTitle('Open X (Formerly Twitter) Profile').click();
  await welcome.getByTitle('Open GitHub Profile').click();
  await dismissWelcome();
  await page.evaluate(() => window.plmInternalRenderer.aboutBox.showAboutBox());
  const about = page.locator('app-about-box');
  for (const title of ['Open Downloads and Release Notes', 'Open X (Formerly Twitter) Profile', 'Open GitHub Profile',
    'Open the troubleshooting page', 'Open the guide to translating this application', 'Open Home Page',
    'View Source Code in GitHub']) {
    await about.getByTitle(title, { exact: true }).click();
  }
  await page.keyboard.press('Escape');
  await expect(about).toHaveCount(0);
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Cache' }).click();
  await page.locator('app-cache-settings').getByText('HEIF files').click();
  const troubleshooting = 'https://github.com/TomoyukiAota/photo-location-map/blob/main/docs/troubleshooting/troubleshooting.md';
  await expect.poll(openedUrls).toEqual([
    troubleshooting, 'https://x.com/TomoyukiAota', 'https://github.com/TomoyukiAota',
    'https://github.com/TomoyukiAota/photo-location-map/releases', 'https://x.com/TomoyukiAota',
    'https://github.com/TomoyukiAota', troubleshooting,
    'https://github.com/TomoyukiAota/photo-location-map/blob/main/docs/TRANSLATING.md',
    'https://tomoyukiaota.github.io/photo-location-map/',
    'https://github.com/TomoyukiAota/photo-location-map',
    'https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format',
  ]);
});
test('the cache settings open the cache folder, and ask before deleting the cache', async () => {
  // Deleting restarts the app once confirmed, so the question is declined.
  await dismissWelcome();
  const openCommands = await recordOpenCommands();
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Cache' }).click();
  const location = page.locator('app-cache-settings .location-value');
  const cacheFolder = (await location.textContent()).trim();
  expect(cacheFolder.startsWith(profile)).toBe(true);
  await location.click();
  await expect.poll(openCommands).toEqual([osOpenCommand(cacheFolder)]);
  await page.getByRole('button', { name: 'Delete Thumbnail Cache', exact: true }).click();
  await answerConfirmation(['This application will restart after deleting the thumbnail cache.', 'Do you want to continue?'], 'Cancel');
  await expect(page.locator('app-settings-dialog')).toBeVisible();
});
test('the OS tab has the main process add and remove the Explorer context menu with reg.exe, its console window hidden', async () => {
  test.skip(process.platform !== 'win32', 'The OS tab is shown on Windows only.');
  // reg.exe never runs here, as it would change the registry of the computer running the suite. In the main process, a
  // stand-in answers execFile of any reg.exe, wherever it would be looked for, recording it with whether it hides its
  // console window, and fails the runs that __plmRegFails picks. Starting reg.exe any other way throws.
  const regExePath = await app.evaluate(() => {
    const childProcess = globalThis.__plmTestRequire('child_process');
    const isRegExe = file => /(^|[\\/])reg(\.exe)?$/i.test(String(file));
    globalThis.__plmRegRuns = [];
    globalThis.__plmRegFails = () => false;
    const execFile = childProcess.execFile;
    childProcess.execFile = function (file, args, options, callback) {
      if (!isRegExe(file)) return execFile.apply(this, arguments);
      globalThis.__plmRegRuns.push({ file, args: [...args], windowsHide: options?.windowsHide === true });
      const failed = globalThis.__plmRegFails(args);
      setImmediate(() => failed
        ? callback(Object.assign(new Error('Failed on purpose'), { code: 1 }), Buffer.alloc(0), Buffer.from('Failed on purpose by the e2e suite'))
        : callback(null, Buffer.alloc(0), Buffer.alloc(0)));
    };
    for (const name of ['spawn', 'spawnSync', 'execFileSync', 'exec', 'execSync']) {
      const original = childProcess[name];
      childProcess[name] = function (fileOrCommand) {
        const startsRegExe = name === 'exec' || name === 'execSync'
          ? /(^|[\s"\\/])reg(\.exe)?("|\s|$)/i.test(String(fileOrCommand)) : isRegExe(fileOrCommand);
        if (startsRegExe) throw new Error(`The e2e suite lets reg.exe start with execFile only, not with ${name}.`);
        return original.apply(this, arguments);
      };
    }
    // The app reads these from child_process's ES module, whose exports follow the CommonJS module's once synced.
    globalThis.__plmTestRequire('node:module').syncBuiltinESMExports();
    return globalThis.__plmTestRequire('path').win32.join(process.env.SystemRoot, 'System32', 'reg.exe');
  });
  /** The runs of reg.exe since the last call, each with its file, its arguments and whether it hid its console window. */
  const regRuns = () => app.evaluate(() => globalThis.__plmRegRuns.splice(0));
  /** The labels of the analytics events with `action`, one for each analytics service. */
  const events = action => app.evaluate((_electron, action) =>
    globalThis.__plmAnalyticsEvents.filter(event => event.action === action).map(event => event.label ?? null), action);
  const exe = await app.evaluate(({ app }) => app.getPath('exe'));
  const keys = ['*', 'Directory', 'Directory\\Background'].map(type => `HKCU\\Software\\Classes\\${type}\\shell\\OpenWithPhotoLocationMap`);
  await dismissWelcome();
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'OS' }).click();
  const osSettings = page.locator('app-os-settings');
  const lines = osSettings.locator('.message-after-button-clicked > div');
  await expect(lines).toHaveCount(0);

  await osSettings.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(lines).toHaveText(['Added "Open with Photo Location Map" in the context menu of Explorer.',
    'Please open Explorer and right-click on a file/folder to confirm.']);
  const addRuns = await regRuns();
  // The exe is quoted in the command, as its path can have spaces; "%V" is the folder whose background was clicked.
  expect(addRuns.map(run => run.args)).toEqual(keys.flatMap((key, index) => [
    ['add', key, '/ve', '/t', 'REG_SZ', '/d', 'Open with &Photo Location Map', '/f'],
    ['add', key, '/v', 'icon', '/t', 'REG_SZ', '/d', exe, '/f'],
    ['add', `${key}\\command`, '/ve', '/t', 'REG_SZ', '/d', `"${exe}" --open "${index === 2 ? '%V' : '%1'}"`, '/f'],
  ]));
  expect(addRuns.every(run => run.windowsHide), 'Every reg.exe must hide its console window.').toBe(true);
  // By its full path: by its name alone, reg.exe would be looked for in the current folder first.
  expect(addRuns.every(run => run.file === regExePath), `Every run must start ${regExePath}.`).toBe(true);

  await osSettings.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(lines).toHaveText(['Removed "Open with Photo Location Map" in the context menu of Explorer.',
    'Please open Explorer and right-click on a file/folder to confirm.']);
  const removeRuns = await regRuns();
  expect(removeRuns.map(run => run.args)).toEqual(keys.map(key => ['delete', key, '/f']));
  expect(removeRuns.every(run => run.windowsHide), 'Every reg.exe must hide its console window.').toBe(true);
  expect(removeRuns.every(run => run.file === regExePath), `Every run must start ${regExePath}.`).toBe(true);

  // A failure is said in the tab, and recorded with its reason, without paths.
  await app.evaluate(() => { globalThis.__plmRegFails = args => args[0] === 'add'; });
  await osSettings.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(lines).toHaveText(['Failed to add "Open with Photo Location Map" in the context menu of Explorer.']);
  // A delete that fails while the key is still there, as the query that follows finds.
  await app.evaluate(() => { globalThis.__plmRegFails = args => args[0] === 'delete'; });
  await osSettings.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(lines).toHaveText(['Failed to remove "Open with Photo Location Map" from the context menu of Explorer.']);
  expect((await regRuns()).map(run => run.args[0])).toEqual(['add', 'delete', 'query']);
  for (const action of ['[Registry] Add Explorer Context Menu', '[Registry] Remove Explorer Context Menu']) {
    await expect.poll(async () => (await events(action)).length, { timeout: 20000 }).toBeGreaterThan(0);
  }
  for (const [action, label] of [['[Registry] Add Explorer Context Menu: Error', 'Error: reg.exe add failed (exit code 1)'],
    ['[Registry] Remove Explorer Context Menu: Error', 'Error: reg.exe delete failed (exit code 1)']]) {
    await expect.poll(async () => (await events(action)).length, { timeout: 20000 }).toBeGreaterThan(0);
    expect(new Set(await events(action))).toEqual(new Set([label]));
  }
  for (const kind of ['Main', 'Renderer']) expect(await events(`Unhandled Error (${kind})`)).toEqual([]);
});
test('appearance setting saves, affects layout, and survives a real app restart', async () => {
  await dismissWelcome();
  await settings('Appearance');
  const checkbox = page.getByRole('checkbox', { name: 'Show Status Bar' });
  const before = await checkbox.isChecked();
  await checkbox.setChecked(!before);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await app.close();
  await launch();
  await expect(page.locator('app-welcome-dialog')).toHaveCount(0);
  await settings('Appearance');
  await expect(page.getByRole('checkbox', { name: 'Show Status Bar' })).toBeChecked({ checked: !before });
  await page.getByRole('checkbox', { name: 'Show Status Bar' }).setChecked(before);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await settings('Appearance');
  await expect(page.getByRole('checkbox', { name: 'Show Status Bar' })).toBeChecked({ checked: !before });
});
test('Show Status Bar shows and hides the loaded-files status bar while it is changed, and Cancel restores it', async () => {
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  const statusBar = page.locator('app-loaded-files-status-bar');
  await expect(statusBar).toContainText('4 files have location data.');
  await expect(statusBar).toBeVisible();
  const showStatusBar = page.getByRole('checkbox', { name: 'Show Status Bar' });
  await settings('Appearance');
  await showStatusBar.uncheck();
  await expect(statusBar).toBeHidden();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await expect(statusBar).toBeVisible();
  await settings('Appearance');
  await showStatusBar.uncheck();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await expect(statusBar).toBeHidden();
});
test('Save is enabled only while a setting differs, and a new date format asks before the restart that saving it needs', async () => {
  await dismissWelcome();
  await settings('Appearance');
  const save = page.getByRole('button', { name: 'Save', exact: true });
  const restartNotice = page.locator('app-settings-dialog').getByText('This application will restart after saving settings.');
  const showStatusBar = page.getByRole('checkbox', { name: 'Show Status Bar' });
  await expect(save).toBeDisabled();
  await expect(restartNotice).toBeHidden();
  await showStatusBar.uncheck();
  await expect(save).toBeEnabled();
  await expect(restartNotice).toBeHidden();
  await showStatusBar.check();
  await expect(save).toBeDisabled();

  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
  const dateFormat = page.getByRole('combobox', { name: 'Date Format' });
  const example = page.locator('.date-time-example');
  await expect(dateFormat).toContainText('YYYY-MM-DD');
  await expect(example).toContainText('2019-11-25 14:53');
  async function chooseDateFormat(name) {
    await dateFormat.click();
    await page.getByRole('option', { name, exact: true }).click();
    // A click on the select while its panel is still closing would not open it again.
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(dateFormat).toContainText(name);
  }
  await chooseDateFormat('DD/MM/YYYY');
  await expect(example).toContainText('25/11/2019 14:53');
  await expect(save).toBeEnabled();
  await expect(restartNotice).toBeVisible();
  await chooseDateFormat('YYYY-MM-DD');
  await expect(save).toBeDisabled();
  await expect(restartNotice).toBeHidden();

  // Saving asks first. Declined, nothing is saved and the dialog stays.
  await chooseDateFormat('DD/MM/YYYY');
  await save.click();
  await answerConfirmation(['This application will restart after saving settings.', 'Do you want to continue?'], 'Cancel');
  await expect(page.locator('app-settings-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await settings('Date & Time');
  await expect(dateFormat).toContainText('YYYY-MM-DD');
  await expect(save).toBeDisabled();
});
test('folder picker loads real photo data, markers, tree selection and chart', async () => {
  await dismissWelcome();
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, photoFolder);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('Loaded 5 files.');
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expect(page.locator('mat-tree-node').filter({ hasText: 'actual-photos' })).toBeVisible();
  await expect(page.locator('.plm-leaflet-map-div-icon')).not.toHaveCount(0);
  await expect(page.locator('app-date-time-taken-chart canvas')).toBeVisible();
  await shot('loaded-home');
  const rootCheckbox = page.locator('mat-tree-node').filter({ hasText: 'actual-photos' }).getByRole('checkbox');
  await expect(rootCheckbox).toBeChecked();
  await rootCheckbox.uncheck();
  await expect(rootCheckbox).not.toBeChecked();
  await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(0);
  await rootCheckbox.check();
  await expect(page.locator('.plm-leaflet-map-div-icon')).not.toHaveCount(0);
  const gutter = page.locator('.sidebar-and-map-container > .gutter-horizontal');
  const before = await page.locator('#home-left-sidebar').boundingBox();
  const box = await gutter.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 100, { steps: 8 }); await page.mouse.up();
  const after = await page.locator('#home-left-sidebar').boundingBox();
  expect(after.width - before.width).toBeGreaterThan(50);
  // The original reference includes the hovered gutter after the drag.
  await page.mouse.move(10, 200);
  await gutter.hover();
  await expect.poll(() => gutter.evaluate(el => el.matches(':hover') &&
    el.getAnimations().every(animation => animation.playState === 'finished'))).toBe(true);
  await expect(gutter).toHaveCSS('background-color', 'rgb(170, 170, 170)');
  // Keep the reference's verified hover state while native screen capture changes focus.
  const cdp = visual ? await page.context().newCDPSession(page) : undefined;
  let gutterNode;
  try {
    if (cdp) {
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      ({ nodeId: gutterNode } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId, selector: '.sidebar-and-map-container > .gutter-horizontal',
      }));
      await cdp.send('CSS.forcePseudoState', { nodeId: gutterNode, forcedPseudoClasses: ['hover'] });
    }
    await shot('resized-home');
  } finally {
    if (cdp) {
      if (gutterNode) await cdp.send('CSS.forcePseudoState', { nodeId: gutterNode, forcedPseudoClasses: [] });
      await cdp.detach();
    }
  }
  await app.close();
  await launch();
  // The original app resets Split.js to 25/75 on restart; keep that behavior.
  const restarted = await page.locator('#home-left-sidebar').boundingBox();
  expect(Math.abs(restarted.width - before.width)).toBeLessThan(1);
});
test('the map starts and shows photos while the network cannot be reached', async () => {
  // Leaflet and its plugins once came from a CDN, so a launch without the network (offline, no DNS, or a firewall
  // blocking the app) had no map: rendering it threw "ReferenceError: L is not defined". Only the tiles need it now.
  const blockedHosts = new Set();
  await page.route(url => /^https?:$/.test(url.protocol) && url.hostname !== 'localhost', route => {
    blockedHosts.add(new URL(route.request().url()).hostname);
    return route.abort('internetdisconnected');
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await page.waitForSelector('app-root app-home');
  await expect(page.locator('.leaflet-pm-toolbar').first()).toBeVisible();
  await dismissWelcome();
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, photoFolder);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  expect(errors).toEqual([]);
  // The tiles were asked for and refused, so the network was really out of reach.
  expect(blockedHosts.size).toBeGreaterThan(0);
});
test('folder picker restores confirmed history after cancellation and a real restart', async () => {
  await dismissWelcome();
  async function capturePicker(canceled) {
    await app.evaluate(({ dialog }, args) => {
      global.__plmFolderOptions = [];
      dialog.showOpenDialog = async (_parent, options) => {
        global.__plmFolderOptions.push({ defaultPath: options.defaultPath ?? null, properties: options.properties });
        return { canceled: args.canceled, filePaths: args.canceled ? [] : [args.folder] };
      };
    }, { canceled, folder: photoFolder });
  }
  await capturePicker(false);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  expect(await app.evaluate(() => global.__plmFolderOptions)).toEqual([{ defaultPath: null, properties: ['openDirectory'] }]);
  await capturePicker(true);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect.poll(() => app.evaluate(() => global.__plmFolderOptions)).toEqual([{ defaultPath: photoFolder, properties: ['openDirectory'] }]);
  await app.close();
  await launch();
  await capturePicker(true);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect.poll(() => app.evaluate(() => global.__plmFolderOptions)).toEqual([{ defaultPath: photoFolder, properties: ['openDirectory'] }]);
  // Remembering a picker directory does not automatically reopen its photos.
  await expect(page.getByRole('treeitem')).toHaveCount(0);
});
test('chart grouping, zoom, reset and photo selection keep their real data behavior', async () => {
  await dismissWelcome();
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, photoFolder);
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  const chart = page.locator('app-date-time-taken-chart .chart');
  await expect(chart.locator('canvas')).toBeVisible();
  const unit = page.locator('app-date-time-taken-chart-config select');
  // An option's value is the unit as the code knows it, and its text is the unit's name, which the user chooses by.
  await expect(unit).toHaveValue('day');
  await expect(unit.locator('option:checked')).toHaveText('Day');
  // Hours cannot show photos taken years apart: the chart says so, until a unit that can is chosen.
  const unsupported = page.locator('app-date-time-taken-chart .unsupported-message');
  await expect(unsupported).toBeHidden();
  await unit.selectOption('Hour');
  await expect(unsupported).toContainText('does not support showing more than 30 days when Hour is selected');
  await unit.selectOption('Year');
  await expect(unit).toHaveValue('year');
  await expect(unit.locator('option:checked')).toHaveText('Year');
  await expect(unsupported).toBeHidden();
  const choose = page.getByRole('button', { name: 'Select Photos within Zoom', exact: true });
  async function zoomToLastYear() {
    const box = await chart.boundingBox();
    // Drag the visible slider's left handle to the final year, keeping its right handle at 100%.
    const plotWidth = box.width - 180;
    const y = box.y + box.height - 23;
    await page.mouse.move(box.x + 94, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 90 + plotWidth * 0.92, y, { steps: 12 });
    await page.mouse.up();
    await expect(choose).toBeVisible();
    // Wait for the debounced filter, including removal of clustered photos.
    await expectRepresentedPhotos(1);
  }
  await zoomToLastYear();
  // The button keeps its width in English, on two lines: it is wider only for a language whose text would take more
  // than three lines (see its component). The lines that a text takes depend on the machine's font, as the
  // screenshots do.
  if (visual) expect(await choose.evaluate(button => [button.getBoundingClientRect().width, button.getBoundingClientRect().height])).toEqual([106, 50]);
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Gold Coast' }).getByRole('checkbox')).toBeChecked();
  const box = await chart.boundingBox();
  // ECharts' rightmost toolbox control is the existing Reset Zoom canvas icon.
  await page.mouse.click(box.x + box.width - 11, box.y + 14);
  await expect(choose).toBeHidden();
  await expectRepresentedPhotos(4);
  await expect(page.locator('.marker-cluster')).toHaveCount(1);
  await zoomToLastYear();
  await choose.click();
  await expect(choose).toBeHidden();
  await expect(page.locator('mat-tree-node').filter({ hasText: 'Apple Park' }).getByRole('checkbox')).toBeChecked();
  for (const name of ['Gold Coast', 'Kobe', 'Unga']) {
    await expect(page.locator('mat-tree-node').filter({ hasText: name }).getByRole('checkbox')).not.toBeChecked();
  }
  await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(1);
});
test('the chart menu counts the photos without a shooting time, and its checkbox shows or hides them on the map', async () => {
  const folder = path.join(profile, 'a photo without a shooting time');
  await mkdir(folder);
  await writeFile(path.join(folder, 'no shooting time.JPG'),
    jpegWithLocationOnly(await readFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG')), 34.688075, 135.195861));
  await copyFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'), path.join(folder, 'Gold Coast.JPG'));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('2 files have location data.');
  await expectRepresentedPhotos(2);
  await page.locator('app-date-time-taken-chart-config .more-options-icon').click();
  await expect(page.locator('.date-unknown-photos-count')).toHaveText('Date-unknown photos: 1');
  const checkbox = page.getByRole('checkbox', { name: 'Show date-unknown photos on the map' });
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expectRepresentedPhotos(1);
  await checkbox.check();
  await expectRepresentedPhotos(2);
});
test('while the chart is zoomed, its checkbox adds the photos without a shooting time, and a new selection ends the zoom', async () => {
  const folder = path.join(profile, 'photos with and without a shooting time');
  await mkdir(folder);
  await writeFile(path.join(folder, 'no shooting time.JPG'),
    jpegWithLocationOnly(await readFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG')), 34.688075, 135.195861));
  await copyFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'), path.join(folder, 'Gold Coast.JPG'));
  await copyFile(path.join(photoFolder, 'Apple Park/IMG_5769.JPG'), path.join(folder, 'Apple Park.JPG'));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('3 files have location data.');
  await expectRepresentedPhotos(3);
  const chart = page.locator('app-date-time-taken-chart .chart');
  await expect(chart.locator('canvas')).toBeVisible();
  await page.locator('app-date-time-taken-chart-config select').selectOption('Year');
  // As the chart case does, drag the slider's left handle to the final year, 2019, which has only the Apple Park photo:
  // the photos were taken from 2013 to 2019, as there.
  const box = await chart.boundingBox();
  const y = box.y + box.height - 23;
  await page.mouse.move(box.x + 94, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 90 + (box.width - 180) * 0.92, y, { steps: 12 });
  await page.mouse.up();
  const choose = page.getByRole('button', { name: 'Select Photos within Zoom', exact: true });
  await expect(choose).toBeVisible();
  // The zoom leaves out the photo without a shooting time, and unchecks the menu's checkbox for such photos.
  await expectRepresentedPhotos(1);
  const menuIcon = page.locator('app-date-time-taken-chart-config .more-options-icon');
  const checkbox = page.getByRole('checkbox', { name: 'Show date-unknown photos on the map' });
  await menuIcon.click();
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expectRepresentedPhotos(2); // The photo in the zoom, and the one without a shooting time.
  await page.keyboard.press('Escape');
  await expect(checkbox).toHaveCount(0);
  // A new selection ends the zoom and checks the checkbox again. Gold Coast, from 2013, shows only if the zoom ended.
  await treeCheckbox('Apple Park.JPG').uncheck();
  await expect(choose).toBeHidden();
  await expectRepresentedPhotos(2);
  await treeCheckbox('Apple Park.JPG').check();
  await expectRepresentedPhotos(3);
  await menuIcon.click();
  await expect(checkbox).toBeChecked();
});
// The next cases cover what a change to signals and zoneless change detection can break: views that show state written
// outside any template event, such as by a timer or an IPC message from the main process. With Zone.js they rendered
// because a tick followed every callback, or because another view happened to ask for change detection at the same
// moment (docs/tasks/20261107_angular-signals-zoneless/INVENTORY.md).
test('the loading-folder dialog follows the loading of the files to the end', async () => {
  // A 100 ms interval writes the dialog's fields, so without a notification the dialog would keep its first text.
  await dismissWelcome();
  await page.evaluate(() => {
    window.__plmLoadingDialogTexts = [];
    new MutationObserver(() => {
      const text = document.querySelector('app-loading-folder-dialog')?.textContent.replace(/\s+/g, ' ').trim();
      if (text && window.__plmLoadingDialogTexts.at(-1) !== text) window.__plmLoadingDialogTexts.push(text);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expect(page.locator('app-loading-folder-dialog')).toHaveCount(0);
  const texts = await page.evaluate(() => window.__plmLoadingDialogTexts);
  expect(texts.some(text => text.includes('Collecting files to load from the opened folder...')),
    `The dialog must start by collecting the files; it showed ${JSON.stringify(texts)}`).toBe(true);
  expect(texts.some(text => /Completed loading all files \(\d+ files\)\./.test(text)),
    `The dialog must show that loading completed before it closes; it showed ${JSON.stringify(texts)}`).toBe(true);
});
test('the tree shows partly selected folders, and Select Only This from its menu selects one folder', async () => {
  // The menu reaches the selection through window.plmInternalRenderer, as the Selection menu does.
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await treeCheckbox('Kobe').uncheck();
  await expect(treeCheckbox('actual-photos')).toBeChecked({ indeterminate: true });
  await expectRepresentedPhotos(3);
  await page.locator('mat-tree-node').filter({ hasText: 'Gold Coast' }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Select Only This' }).click();
  await expect(treeCheckbox('Gold Coast')).toBeChecked();
  for (const name of ['Apple Park', 'Kobe', 'Unga']) await expect(treeCheckbox(name)).not.toBeChecked();
  await expect(treeCheckbox('actual-photos')).toBeChecked({ indeterminate: true });
  await expectRepresentedPhotos(1);
});
test('a folder of the tree expands and collapses, and keeps the selection of its photos', async () => {
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  // Only the opened folder is expanded after loading, so its subfolders show, but not their photos. A node is found by
  // its name exactly: the text of a folder's node has its toggle's icon name too, such as "chevron_right".
  const treeNode = name => page.locator('mat-tree-node').filter({ has: page.getByText(name, { exact: true }) });
  const kobe = treeNode('Kobe');
  const kobeToggle = kobe.getByRole('button');
  const photo = treeNode('IMG_4676.JPG');
  await expect(photo).toHaveCount(0);
  await expect(kobe).toHaveAttribute('aria-expanded', 'false');
  await kobeToggle.click();
  await expect(photo).toBeVisible();
  await expect(kobe).toHaveAttribute('aria-expanded', 'true');
  await expect(kobe.locator('mat-icon')).toHaveText('expand_more');
  await expect(photo.getByRole('checkbox')).toBeChecked();
  // Two folders above the photo follow its checkbox.
  await photo.getByRole('checkbox').uncheck();
  await expect(kobe.getByRole('checkbox')).not.toBeChecked();
  await expect(treeCheckbox('actual-photos')).toBeChecked({ indeterminate: true });
  await expectRepresentedPhotos(3);
  await kobeToggle.click();
  await expect(photo).toHaveCount(0);
  await expect(kobe).toHaveAttribute('aria-expanded', 'false');
  await expect(kobe.locator('mat-icon')).toHaveText('chevron_right');
  await kobeToggle.click();
  await expect(photo.getByRole('checkbox')).not.toBeChecked();
  await expect(kobe.getByRole('checkbox')).not.toBeChecked();
  await expectRepresentedPhotos(3);
});
test('a right-click outside the tree\'s context menu closes it', async () => {
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expect(page.locator('.cdk-overlay-backdrop')).toHaveCount(0);
  // Right after a folder has loaded, the loading dialog's backdrop can still be fading out when the menu opens, before
  // the menu's own. A stand-in for it, first in the overlay container, keeps that state for as long as this case needs.
  await page.evaluate(() => {
    const backdrop = document.createElement('div');
    backdrop.className = 'cdk-overlay-backdrop';
    backdrop.style.pointerEvents = 'none'; // As the CDK leaves a backdrop that is going away.
    document.querySelector('.cdk-overlay-container').prepend(backdrop);
  });
  const selectOnlyThis = page.getByRole('menuitem', { name: 'Select Only This' });
  await page.locator('mat-tree-node').filter({ hasText: 'Kobe' }).click({ button: 'right' });
  await expect(selectOnlyThis).toBeVisible();
  await page.locator('.cdk-overlay-transparent-backdrop').click({ button: 'right', position: { x: 5, y: 5 } });
  await expect(selectOnlyThis).toHaveCount(0);
  await expect(treeCheckbox('Kobe')).toBeChecked();
});
test('Select Only This from a marker popup selects that photo in the tree and on the map', async () => {
  // The popup's content is an Angular component that the map makes for Leaflet, outside any template.
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  // A click event on the marker itself, as a marker can lie under the edge of the map at this zoom.
  await page.locator('.plm-leaflet-map-div-icon').first().dispatchEvent('click');
  const popup = page.locator('.leaflet-popup');
  await expect(popup.locator('.photo-info-viewer-name')).toBeVisible();
  const photoName = (await popup.locator('.photo-info-viewer-name').textContent()).trim();
  await popup.locator('.photo-info-viewer-more-options-button').click();
  await page.locator('.photo-info-viewer-more-options-menu-item').filter({ hasText: 'Select Only This' }).click();
  await expectRepresentedPhotos(1);
  const folders = { 'IMG_5769.JPG': 'Apple Park', 'IMG_1579.JPG': 'Gold Coast', 'IMG_4676.JPG': 'Kobe', 'IMG_2581.JPG': 'Unga' };
  expect(Object.keys(folders)).toContain(photoName);
  for (const [name, folder] of Object.entries(folders))
    await expect(treeCheckbox(folder)).toBeChecked({ checked: name === photoName });
});
test('a cluster of photos taken at one place opens a popup with each of them', async () => {
  const folder = path.join(profile, 'photos taken at one place');
  await mkdir(folder);
  for (const name of ['Kobe 1.JPG', 'Kobe 2.JPG']) await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, name));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('2 files have location data.');
  const cluster = page.locator('.marker-cluster');
  await expect(cluster).toHaveCount(1);
  // At the map's last zoom level the cluster cannot split, so a click shows its photos; before that, it zooms in.
  await expect.poll(async () => {
    if (await page.locator('.photo-cluster-viewer-tile').count() === 0 && await cluster.count() === 1) await cluster.click();
    return page.locator('.photo-cluster-viewer-tile').count();
  }, { timeout: 20000 }).toBe(2);
  // The first tile is chosen, and its photo's information is beside the tiles. A click on the other tile shows the
  // other photo's. The two photos were taken at the same time, so either can be first.
  const tiles = page.locator('.photo-cluster-viewer-tile');
  const shownName = page.locator('.photo-cluster-viewer-right-pane .photo-info-viewer-name');
  await expect(tiles.first()).toHaveClass(/selected-tile/);
  await expect(tiles.nth(1)).not.toHaveClass(/selected-tile/);
  await expect(shownName).toHaveText(/^Kobe [12]\.JPG$/);
  const firstName = await shownName.textContent();
  await tiles.nth(1).click();
  await expect(tiles.nth(1)).toHaveClass(/selected-tile/);
  await expect(tiles.first()).not.toHaveClass(/selected-tile/);
  await expect(shownName).toHaveText(firstName === 'Kobe 1.JPG' ? 'Kobe 2.JPG' : 'Kobe 1.JPG');
  // A tile's small button, which shows while the pointer is over the tile's thumbnail, turns that thumbnail without
  // choosing the tile. The photo beside the tiles is turned on its own.
  await tiles.first().locator('.photo-info-viewer-thumbnail-container').hover();
  await tiles.first().locator('.photo-info-viewer-rotate-button-in-thumbnail-container').click();
  await expect(tiles.first().locator('.photo-info-viewer-thumbnail')).toHaveAttribute('style', /rotate\(90deg\)/);
  await expect(tiles.nth(1)).toHaveClass(/selected-tile/);
  await tiles.first().click();
  await expect(shownName).toHaveText(firstName);
  await expect(page.locator('.photo-cluster-viewer-right-pane .photo-info-viewer-thumbnail')).toHaveCSS('transform', 'none');
});
test('a photo\'s information, in the tree and in a popup of the map, opens the photo, its folder and its Live Photos movie, and keeps its thumbnail turned', async () => {
  // The same Angular component in both places, with what it keeps in services: a row of the tree and the content of a
  // popup are made again, and show the thumbnail as it was turned.
  const folder = path.join(profile, 'a photo with a movie');
  await mkdir(folder);
  const photo = path.join(folder, 'IMG_4676.JPG');
  const movie = path.join(folder, 'IMG_4676.MOV');
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), photo);
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.MOV'), movie);
  await dismissWelcome();
  const openCommands = await recordOpenCommands();
  const openedUrls = await recordOpenedUrls();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('1 files have location data.');
  const turned = degrees => new RegExp(`rotate\\(${degrees}deg\\)`);
  const menu = page.locator('.photo-info-viewer-more-options-menu');
  const menuItem = name => page.locator('.photo-info-viewer-more-options-menu-item').filter({ hasText: name });

  // The photo's row of the tree: its thumbnail and shooting time, and its buttons while the pointer is over it.
  const row = page.locator('mat-tree-node').filter({ hasText: 'IMG_4676.JPG' });
  const inTree = row.locator('app-photo-info-viewer');
  const thumbnailInTree = inTree.locator('.photo-info-viewer-thumbnail');
  await expect(inTree.locator('.photo-info-viewer-date-time-taken')).toHaveText('2017-12-16 Sat 20:11:22');
  await expect(inTree.locator('.photo-info-viewer-name')).toHaveCount(0);
  await page.locator('app-loaded-files-status-bar').hover();
  await expect(inTree.locator('.photo-info-viewer-lower-div')).toHaveCSS('opacity', '0');
  await thumbnailInTree.hover();
  await expect(inTree.locator('.photo-info-viewer-lower-div')).toHaveCSS('opacity', '1');
  await inTree.getByRole('button', { name: 'Rotate Thumbnail' }).click();
  await expect(thumbnailInTree).toHaveAttribute('style', turned(90));
  await inTree.getByRole('button', { name: 'Open File' }).click();
  await inTree.getByRole('button', { name: 'Live Photos' }).click();
  await thumbnailInTree.click();
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(page.locator('.photo-info-viewer-more-options-menu-item'))
    .toHaveText(['Select Only This', 'Open Folder', 'Open Google Maps', 'Open Google Street View', 'View Data']);
  // A click on an item does what the item says, and closes the menu.
  await menuItem('Open Folder').click();
  await expect(menu).toHaveCount(0);
  await expect.poll(openCommands).toEqual([
    osOpenCommand(photo), osOpenCommand(movie), osOpenCommand(photo), osOpenCommand(photo, { containingFolder: true }),
  ]);
  // The menu closes when its button is clicked again, and when something else is clicked.
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(1);
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(0);
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(1);
  await page.locator('app-loaded-files-status-bar').click();
  await expect(menu).toHaveCount(0);
  // The row is made again when its folder is collapsed and expanded.
  const folderToggle = page.locator('mat-tree-node').filter({ has: page.getByText('a photo with a movie', { exact: true }) }).getByRole('button');
  await folderToggle.click();
  await expect(row).toHaveCount(0);
  await folderToggle.click();
  await expect(thumbnailInTree).toHaveAttribute('style', turned(90));

  // The popup of the only photo on the map, which opens by itself: the photo's name too, and a turn of its own.
  const popup = page.locator('.leaflet-popup');
  const inPopup = popup.locator('app-photo-info-viewer');
  const thumbnailInPopup = inPopup.locator('.photo-info-viewer-thumbnail');
  await expect(inPopup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
  await expect(inPopup.locator('.photo-info-viewer-date-time-taken')).toHaveText('2017-12-16 Sat 20:11:22');
  await expect(thumbnailInPopup).toHaveCSS('transform', 'none');
  await inPopup.getByRole('button', { name: 'Rotate Thumbnail' }).click();
  await inPopup.getByRole('button', { name: 'Rotate Thumbnail' }).click();
  await expect(thumbnailInPopup).toHaveAttribute('style', turned(180));
  await inPopup.getByRole('button', { name: 'More Options' }).click();
  await menuItem('Open Google Maps').click();
  await inPopup.getByRole('button', { name: 'More Options' }).click();
  await menuItem('Open Google Street View').click();
  await expect.poll(openedUrls).toEqual([
    expect.stringMatching(/^https:\/\/maps\.google\.com\/\?q=[\d.]+,[\d.]+&ll=[\d.]+,[\d.]+&z=14$/),
    expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/@\?api=1&map_action=pano&parameters&viewpoint=[\d.]+,[\d.]+$/),
  ]);
  // Closed and opened again, the popup shows the same content.
  await popup.locator('.leaflet-popup-close-button').click();
  await expect(popup).toHaveCount(0);
  await page.locator('.plm-leaflet-map-div-icon').first().dispatchEvent('click');
  await expect(thumbnailInPopup).toHaveAttribute('style', turned(180));
  // The map is rendered again when the selection changes, and the popup's content is made again.
  await treeCheckbox('IMG_4676.JPG').uncheck();
  await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(0);
  await treeCheckbox('IMG_4676.JPG').check();
  await expect(thumbnailInPopup).toHaveAttribute('style', turned(180));
  await expect(thumbnailInTree).toHaveAttribute('style', turned(90));

  // Another folder turns every thumbnail back.
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('1 files have location data.');
  await expect(thumbnailInTree).toHaveCSS('transform', 'none');
  await expect(thumbnailInPopup).toHaveCSS('transform', 'none');
});
test('undo and redo step through the photo selection from the Selection menu, which enables them when they apply', async () => {
  // The menu reaches the renderer through IPC, outside any template event, and the tree selects programmatically. The
  // renderer tells the main process which of the two items apply. Their accelerators come from the OS's menu.
  const menuItem = id => ({
    click: () => app.evaluate(({ Menu }, id) => Menu.getApplicationMenu().getMenuItemById(id).click(), id),
    enabled: () => app.evaluate(({ Menu }, id) => Menu.getApplicationMenu().getMenuItemById(id).enabled, id),
  });
  const undo = menuItem('photo-selection-undo');
  const redo = menuItem('photo-selection-redo');
  const enabled = async () => ({ undo: await undo.enabled(), redo: await redo.enabled() });
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  await expect.poll(enabled).toEqual({ undo: false, redo: false });
  await treeCheckbox('Kobe').uncheck();
  await expectRepresentedPhotos(3);
  await treeCheckbox('Unga').uncheck();
  await expectRepresentedPhotos(2);
  await expect.poll(enabled).toEqual({ undo: true, redo: false });
  await undo.click();
  await expect(treeCheckbox('Unga')).toBeChecked();
  await expect(treeCheckbox('Kobe')).not.toBeChecked();
  await expectRepresentedPhotos(3);
  await expect.poll(enabled).toEqual({ undo: true, redo: true });
  await undo.click();
  await expect(treeCheckbox('Kobe')).toBeChecked();
  await expectRepresentedPhotos(4);
  await expect.poll(enabled).toEqual({ undo: false, redo: true });
  await redo.click();
  await expect(treeCheckbox('Kobe')).not.toBeChecked();
  await expect(treeCheckbox('Unga')).toBeChecked();
  await expectRepresentedPhotos(3);
  await redo.click();
  await expect(treeCheckbox('Unga')).not.toBeChecked();
  await expectRepresentedPhotos(2);
  await expect.poll(enabled).toEqual({ undo: true, redo: false });
});
test('the sort menu orders the tree by name and by shooting time, shows its choice, and keeps it across a restart', async () => {
  // Photos named against the order they were taken in (Apple Park 2019, Kobe 2017, Unga 2015, Gold Coast 2013), so
  // that sorting by name and by shooting time give different orders, and two folders, which always sort by name.
  const folder = path.join(profile, 'sorted by name and by shooting time');
  await mkdir(folder);
  for (const [name, source] of [['a Apple Park.JPG', 'Apple Park/IMG_5769.JPG'], ['b Kobe.JPG', 'Kobe/IMG_4676.JPG'],
    ['c Unga.JPG', 'Unga/IMG_2581.JPG'], ['d Gold Coast.JPG', 'Gold Coast/IMG_1579.JPG']])
    await copyFile(path.join(photoFolder, source), path.join(folder, name));
  for (const subfolder of ['x', 'y']) {
    await mkdir(path.join(folder, subfolder));
    await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, subfolder, 'IMG_4676.JPG'));
  }
  const root = path.basename(folder);
  const byName = ['a Apple Park.JPG', 'b Kobe.JPG', 'c Unga.JPG', 'd Gold Coast.JPG'];
  const byShootingTime = ['d Gold Coast.JPG', 'c Unga.JPG', 'b Kobe.JPG', 'a Apple Park.JPG'];
  /** The names of the tree's nodes as they are shown, from the top: the folder, its subfolders, then its photos. */
  const treeNames = () => page.locator('mat-tree-node')
    .evaluateAll(nodes => nodes.map(node => node.querySelector('mat-checkbox, .non-selectable-node')?.textContent.trim()));
  const sortMenuItem = name => page.locator('button[mat-menu-item]').filter({ hasText: name });
  /** Chooses an item of the Sort submenu, which closes the menu. */
  async function chooseInSortMenu(name) {
    await page.locator('.more-options-button').click();
    await sortMenuItem('Sort').click();
    await sortMenuItem(name).click();
    await expect(page.locator('.mat-mdc-menu-panel')).toHaveCount(0);
  }
  /** Checks which items of the Sort submenu have their checkmark shown, then closes the menu. */
  async function expectChecked(checkedItems, uncheckedItems) {
    await page.locator('.more-options-button').click();
    await sortMenuItem('Sort').click();
    for (const name of checkedItems) await expect(sortMenuItem(name).locator('mat-icon').first()).toHaveCSS('visibility', 'visible');
    for (const name of uncheckedItems) await expect(sortMenuItem(name).locator('mat-icon').first()).toHaveCSS('visibility', 'hidden');
    // A click outside closes the menu together with its submenu.
    await page.locator('.cdk-overlay-backdrop').first().click({ position: { x: 5, y: 5 } });
    await expect(page.locator('.mat-mdc-menu-panel')).toHaveCount(0);
  }
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('6 files have location data.');
  await expect.poll(treeNames).toEqual([root, 'x', 'y', ...byName]);
  await expectChecked(['By Name', 'Ascending'], ['By Shooting Time', 'Descending']);
  await chooseInSortMenu('Descending');
  await expect.poll(treeNames).toEqual([root, 'y', 'x', ...[...byName].reverse()]);
  await chooseInSortMenu('By Shooting Time');
  await expect.poll(treeNames).toEqual([root, 'y', 'x', ...[...byShootingTime].reverse()]);
  await expectChecked(['By Shooting Time', 'Descending'], ['By Name', 'Ascending']);
  // The info button beside "By Shooting Time" explains it, with details that open and close.
  await page.locator('.more-options-button').click();
  await sortMenuItem('Sort').click();
  await sortMenuItem('By Shooting Time').locator('button').click();
  const info = page.locator('app-dir-tree-view-sort-shooting-time-info');
  await expect(info).toContainText('Sort By Shooting Time');
  const detailsButton = info.getByRole('button', { name: 'More details for reference' });
  await detailsButton.click();
  await expect(info.locator('.message-details')).toBeVisible();
  await detailsButton.click();
  await expect(info.locator('.message-details')).toHaveCount(0);
  await info.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(info).toHaveCount(0);
  if (await page.locator('.mat-mdc-menu-panel').count())
    await page.locator('.cdk-overlay-backdrop').first().click({ position: { x: 5, y: 5 } });
  await expect(page.locator('.mat-mdc-menu-panel')).toHaveCount(0);
  await app.close();
  await launch();
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('6 files have location data.');
  await expect.poll(treeNames).toEqual([root, 'y', 'x', ...[...byShootingTime].reverse()]);
  await expectChecked(['By Shooting Time', 'Descending'], ['By Name', 'Ascending']);
  await chooseInSortMenu('Ascending');
  await expect.poll(treeNames).toEqual([root, 'x', 'y', ...byShootingTime]);
});
test('--open loads a directory with Unicode, spaces, # and % without restoring photos on an ordinary restart', async () => {
  const folder = path.join(profile, '写真 folder # 100%');
  await mkdir(folder);
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, '神戸 # 50% photo.JPG'));
  const previousOpen = process.env.PLM_E2E_OPEN;
  try {
    process.env.PLM_E2E_OPEN = folder;
    await app.close();
    await launch();
    await dismissWelcome();
    await expect(page.locator('app-loaded-files-status-bar')).toContainText('Loaded 1 files.');
    await expect(page.locator('app-loaded-files-status-bar')).toContainText('1 files have location data.');
    await expect(page.locator('mat-tree-node').filter({ hasText: path.basename(folder) })).toBeVisible();
    await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(1);
    delete process.env.PLM_E2E_OPEN;
    await app.close();
    await launch();
    await expect(page.locator('app-loaded-files-status-bar .message-container')).toHaveCount(0);
    await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(0);
  } finally {
    if (previousOpen === undefined) delete process.env.PLM_E2E_OPEN;
    else process.env.PLM_E2E_OPEN = previousOpen;
  }
});
test('--open with a photo opens its folder with only that photo selected', async () => {
  // Opening the folder builds the tree and selects every photo before it resolves; only then is the photo selected.
  // Building the tree later, as an effect would, would leave every photo selected.
  const folder = path.join(profile, 'opened through a photo');
  await mkdir(folder);
  await copyFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'), path.join(folder, 'Gold Coast.JPG'));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  const previousOpen = process.env.PLM_E2E_OPEN;
  try {
    process.env.PLM_E2E_OPEN = path.join(folder, 'Kobe.JPG');
    await app.close();
    await launch();
    await dismissWelcome();
    await expect(page.locator('app-loaded-files-status-bar')).toContainText('2 files have location data.');
    await expect(treeCheckbox('Kobe.JPG')).toBeChecked();
    await expect(treeCheckbox('Gold Coast.JPG')).not.toBeChecked();
    await expectRepresentedPhotos(1);
  } finally {
    if (previousOpen === undefined) delete process.env.PLM_E2E_OPEN;
    else process.env.PLM_E2E_OPEN = previousOpen;
  }
});
test('a photo whose GPS values are empty leaves the other photos on the map', async () => {
  // exifr gives such a photo's latitude and longitude as the text "NaNNaN", and Leaflet threw on its marker. The
  // error ended the loop that added the markers, so the folder had no markers at all, and the map kept its progress
  // bar. The photo sorts first, so that the loop would end before any marker.
  const folder = path.join(profile, 'empty GPS values');
  await mkdir(folder);
  await writeFile(path.join(folder, '1 empty GPS values.JPG'),
    jpegWithEmptyGpsValues(await readFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'))));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, '2 Kobe.JPG'));
  const previousOpen = process.env.PLM_E2E_OPEN;
  try {
    process.env.PLM_E2E_OPEN = folder;
    await app.close();
    await launch();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await dismissWelcome();
    await expect(page.locator('app-loaded-files-status-bar')).toContainText('Loaded 2 files.');
    await expect(page.locator('app-loaded-files-status-bar')).toContainText('1 files have location data.');
    await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(1);
    await expect(page.locator('.update-in-progress-overlay')).toHaveCSS('visibility', 'hidden');
    expect(errors).toEqual([]);
  } finally {
    if (previousOpen === undefined) delete process.env.PLM_E2E_OPEN;
    else process.env.PLM_E2E_OPEN = previousOpen;
  }
});
test('a window resize keeps the sidebar\'s upper pane, and Leaflet fits the map to its pane', async () => {
  // Home sets the sidebar's split again on a resize, keeping its upper pane's height, and Leaflet, which tracks the
  // window's size, takes its pane's new size. Neither goes through change detection.
  await page.addInitScript(() => {
    let leaflet;
    Object.defineProperty(window, 'L', {
      configurable: true, enumerable: true,
      get: () => leaflet,
      set: lib => {
        leaflet = lib;
        lib?.Map?.addInitHook(function () {
          if (this.getContainer().id === 'plm-leaflet-map') window.__plmLeafletMap = this;
        });
      }
    });
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__plmLeafletMap);
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expectRepresentedPhotos(4);
  const upperPane = page.locator('#home-sidebar-upper-pane');
  const upperPaneHeight = (await upperPane.boundingBox()).height;
  const mapSizes = () => page.evaluate(() => {
    const size = window.__plmLeafletMap.getSize();
    const container = window.__plmLeafletMap.getContainer();
    return { leaflet: [size.x, size.y], pane: [container.clientWidth, container.clientHeight] };
  });
  const before = await mapSizes();
  expect(before.leaflet).toEqual(before.pane);
  await app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    const [width, height] = window.getContentSize();
    window.setContentSize(width - 200, height - 120);
  });
  await expect.poll(async () => (await mapSizes()).pane[0]).toBeLessThan(before.pane[0] - 100);
  await expect.poll(async () => { const sizes = await mapSizes(); return sizes.leaflet.join() === sizes.pane.join(); }).toBe(true);
  await expect.poll(async () => Math.round((await upperPane.boundingBox()).height)).toBe(Math.round(upperPaneHeight));
  await expectRepresentedPhotos(4);
});
test('window bounds survive restart and the Windows fullscreen menu stays visible', async () => {
  await dismissWelcome();
  if (process.platform === 'win32') {
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setFullScreen(true));
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(true);
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMenuBarVisible())).toBe(true);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setFullScreen(false));
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(false);
  }
  const saved = await app.evaluate(({ BrowserWindow, screen }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const area = screen.getDisplayMatching(win.getBounds()).workArea;
    const bounds = { x: area.x + 40, y: area.y + 40,
      width: Math.min(1080, area.width - 80), height: Math.min(720, area.height - 80) };
    win.setBounds(bounds);
    return bounds;
  });
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds())).toEqual(saved);
  await app.close();
  await launch({ resize: false });
  const restored = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
  expect(restored).toEqual(saved);
});
test('a saved maximized or full-screen main window stays off the screen in a headless run', async () => {
  test.skip(!headless, 'Only a headless run, on macOS or Windows, keeps the window off the screen.');
  await app.close();
  // electron-window-state saved the main window's state in the profile when the app quit.
  const stateFile = path.join(profile, 'userData', 'window-state.json');
  const state = JSON.parse(await readFile(stateFile, 'utf8'));
  await writeFile(stateFile, JSON.stringify({ ...state, isMaximized: true, isFullScreen: true }));
  await launch({ resize: false });
  // The app restores the saved state when it starts loading the page, which can be after launch()
  // first checks the window, so check again now that the page has loaded.
  const mainWindow = await app.browserWindow(page);
  await expectWindowOffScreenOnlyIfHeadless(mainWindow);
  expect(await mainWindow.evaluate(window => [window.isMaximized(), window.isFullScreen()])).toEqual([false, false]);
  // On macOS, a window becomes full screen only after a transition, so check that none was asked for.
  expect(await app.evaluate(() => globalThis.__plmWindowStateCalls)).toEqual([]);
});
test('the main window\'s page runs isolated, without Node.js, and reaches the main process only through its bridge', async () => {
  // The preferences that Electron applied to the window, not only those that the code asked for.
  const preferences = await app.evaluate(({ BrowserWindow }) => {
    const applied = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { contextIsolation: applied.contextIsolation, nodeIntegration: applied.nodeIntegration,
      nodeIntegrationInWorker: applied.nodeIntegrationInWorker, sandbox: applied.sandbox };
  });
  expect(preferences).toEqual({ contextIsolation: true, nodeIntegration: false, nodeIntegrationInWorker: false, sandbox: true });
  // Neither the page nor a worker of it has Node.js; the bridge is frozen and has no generic way to the main process.
  const inPage = await page.evaluate(async () => ({
    globals: ['require', 'process', 'module', 'Buffer', 'global', 'setImmediate'].map(name => [name, typeof window[name]]),
    worker: await new Promise(resolve => {
      const worker = new Worker(URL.createObjectURL(new Blob(['postMessage([typeof require, typeof process])'])));
      worker.onmessage = message => { resolve(message.data); worker.terminate(); };
    }),
    frozen: Object.isFrozen(window.plm) && Object.isFrozen(window.plm.shell) && Object.isFrozen(window.plm.startup),
    members: Object.values(window.plm).flatMap(member => typeof member === 'object' && member ? Object.keys(member) : []),
  }));
  expect(inPage.globals).toEqual(['require', 'process', 'module', 'Buffer', 'global', 'setImmediate'].map(name => [name, 'undefined']));
  expect(inPage.worker).toEqual(['undefined', 'undefined']);
  expect(inPage.frozen).toBe(true);
  for (const generic of ['send', 'sendSync', 'invoke', 'on', 'ipcRenderer']) expect(inPage.members).not.toContain(generic);
  // The main process answers the page only what it may ask for.
  const refused = await page.evaluate(async root => {
    const failure = async request => { try { await request(); return 'answered'; } catch (error) { return error.message; } };
    return {
      tree: await failure(() => window.plm.directoryTree.create(root)),
      file: await failure(() => window.plm.shell.openWithAssociatedApp(`${root}/package.json`)),
      url: await failure(() => window.plm.shell.openExternal('file:///etc/hosts')),
      isDirectory: await window.plm.folderDialog.isDirectory(root),
    };
  }, root);
  // Nor does the window leave the app's page, for a link or a new window, which would give another page the bridge.
  const pageUrl = page.url();
  expect(await page.evaluate(() => {
    const opened = window.open('https://example.com/');
    window.location.href = 'https://example.com/';
    return opened;
  })).toBeNull();
  await page.waitForTimeout(500);
  expect(page.url()).toBe(pageUrl);
  expect(app.windows()).toHaveLength(1);
  expect(refused.tree).toContain('Only a folder that the user chose can be read.');
  expect(refused.file).toContain('Only a file or folder in a folder that the user opened can be opened with the OS.');
  expect(refused.url).toContain('Only an http or https URL can be opened in the OS browser.');
  expect(refused.isDirectory).toBe(false);
  // Another window's page, even one with Node.js as Photo Data Viewer's still has, gets nothing of the main window's.
  const fromAnotherWindow = await app.evaluate(async ({ BrowserWindow }) => {
    const other = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    try {
      await other.loadURL('data:text/html,<title>Another window</title>');
      return await other.webContents.executeJavaScript(`(async () => {
        const { ipcRenderer } = require('electron');
        let exif, photo;
        try { await ipcRenderer.invoke('ipc-constants-read-exif', '/photo.jpg'); exif = 'answered'; } catch (error) { exif = error.message; }
        try { await ipcRenderer.invoke('ipc-constants-photo-data-viewer-photo'); photo = 'answered'; } catch (error) { photo = error.message; }
        return { startup: ipcRenderer.sendSync('ipc-constants-get-startup-metadata'),
          settings: ipcRenderer.sendSync('ipc-constants-user-data-storage-snapshot'), exif, photo };
      })()`);
    } finally {
      other.destroy();
    }
  });
  expect(fromAnotherWindow).toEqual({ startup: null, settings: null, exif: expect.stringContaining('Reading EXIF is only for the main window.'),
    photo: expect.stringContaining('Only the page of Photo Data Viewer in its window has a photo.') });
});
test('the main window gets animation frames while its page changes', async () => {
  // A hidden window on Windows gets about 1 frame per second once its page changes (see
  // electron-util/e2e-test-hooks.js), so check the rate that the run's own window gets.
  const frames = await page.evaluate(() => new Promise(resolve => {
    const box = document.body.appendChild(document.createElement('div'));
    box.style.cssText = 'position: fixed; left: 0; top: 0; width: 10px; height: 10px; background: red; z-index: 2147483647';
    let count = 0, running = true;
    const tick = () => {
      if (!running) return;
      box.style.transform = `translateX(${++count % 2}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => { running = false; box.remove(); resolve(count); }, 1000);
  }));
  const refreshRate = await app.evaluate(({ screen }) => screen.getPrimaryDisplay().displayFrequency);
  console.info(`Animation frames in 1 second: ${frames} (display refresh rate: ${refreshRate} Hz)`);
  expect(frames, 'The window must keep getting animation frames, not about 1 per second.').toBeGreaterThan(20);
});
test('an unhandled promise rejection in the renderer is recorded once, with its message', async () => {
  // Without Zone.js, the window's unhandledrejection listener gets every one. With it, Angular's ErrorHandler got one
  // made in Angular's zone, wrapped as "Uncaught (in promise)", and recorded it once with its message as here, while
  // zone.js only logged one made outside, such as this one.
  await dismissWelcome();
  const message = 'Rejected on purpose by the e2e suite';
  await page.evaluate(message => { Promise.reject(new Error(message)); }, message);
  const recorded = service => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents
    .filter(event => event.service === service && event.action === 'Unhandled Error (Renderer)')
    .map(event => ({ category: event.category, label: event.label })), service);
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => recorded(service), { timeout: 20000 })
      .toEqual([{ category: 'Unhandled Error', label: `Error: ${message}` }]);
  }
  // A second report of the same error would be sent before an event tracked after it, so wait for one.
  await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    const { Analytics } = require(require('node:path').join(app.getAppPath(), 'out/app/src-shared/analytics/analytics.js'));
    Analytics.trackEvent('E2E', 'After the rejection');
  });
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents
      .filter(event => event.service === service && event.action === 'After the rejection').length, service),
    { timeout: 20000 }).toBe(1);
    expect(await recorded(service)).toHaveLength(1);
  }
});
test('analytics preserves events and identity without new Amplitude local URLs', async () => {
  await dismissWelcome();
  if (process.env.PLM_ANALYTICS_NEGATIVE_CONTROL === '1') {
    await page.evaluate(async () => {
      const sdk = window.__plmCreateAmplitudeInstance();
      await sdk.init('00000000000000000000000000000000', 'compatibility-user', {
        fetchRemoteConfig: false, enableDiagnostics: false
      }).promise;
      sdk.flush();
    });
  }
  const userId = await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    const path = require('node:path');
    const { Analytics } = require(path.join(app.getAppPath(), 'out/app/src-shared/analytics/analytics.js'));
    const { AnalyticsConfig } = require(path.join(app.getAppPath(), 'out/app/src-shared/analytics/config/analytics-config.js'));
    Analytics.trackEvent('Compatibility', 'Dependency Upgrade Check', 'fixed label', 17);
    return AnalyticsConfig.userId;
  });
  if (process.env.PLM_ANALYTICS_URL_NEGATIVE_CONTROL) {
    await page.evaluate(async ({ userId, enrichmentOnly }) => {
      const sdk = window.__plmCreateAmplitudeInstance();
      await sdk.init('00000000000000000000000000000000', userId, {
        deviceId: userId, fetchRemoteConfig: false, enableDiagnostics: false,
        ...(enrichmentOnly ? { autocapture: { pageViews: false } } : {}),
      }).promise;
      sdk.flush();
    }, { userId, enrichmentOnly: process.env.PLM_ANALYTICS_URL_NEGATIVE_CONTROL === 'enrichment' });
  }
  await settings();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents.filter(event =>
      event.service === service && event.action === 'Dependency Upgrade Check'), service), { timeout: 20000 }).toEqual([
      { service, action: 'Dependency Upgrade Check', category: 'Compatibility', label: 'fixed label', value: 17,
        ...(service === 'amplitude' ? { userId, deviceId: userId } : { distinctId: userId }) }
    ]);
  }
  await expect.poll(() => app.evaluate(() => globalThis.__plmAnalyticsEvents
    .filter(event => event.service === 'amplitude').map(event => event.action)), { timeout: 20000 })
    .toContain('session_start');
  const events = await app.evaluate(() => globalThis.__plmAnalyticsEvents);
  expect(await app.evaluate(() => globalThis.__plmAnalyticsParseErrors)).toBe(0);
  const amplitudeEvents = events.filter(event => event.service === 'amplitude');
  for (const event of amplitudeEvents)
    expect({ userId: event.userId, deviceId: event.deviceId }).toEqual({ userId, deviceId: userId });
  expect(amplitudeEvents.filter(event => event.action === '[Amplitude] Page Viewed')).toEqual([]);
  const urlChecks = await app.evaluate(() => globalThis.__plmAmplitudeUrlProperties);
  expect(urlChecks.length).toBeGreaterThan(0);
  for (const event of urlChecks) {
    expect(event.keys).toEqual([]);
    expect(event.hasLocalFileUrl).toBe(false);
  }
  expect(amplitudeEvents.filter(event => /^\[Amplitude\] Element (Clicked|Changed)$/.test(event.action))).toEqual([]);
  expect(events.filter(event => event.service === 'mixpanel' && /^\$mp_/.test(event.action))).toEqual([]);
});
test('HEIC worker generates the approved bounded JPEG and reports corrupt input', async () => {
  const result = await app.evaluate(async ({ app }, { root, profile }) => {
    const require = globalThis.__plmTestRequire;
    const path = require('node:path');
    const fs = require('node:fs');
    const appRoot = app.getAppPath();
    const decoderRequire = require('node:module').createRequire(path.join(appRoot, 'node_modules/heic-decode/package.json'));
    const decoderVersions = {
      heicDecode: decoderRequire('./package.json').version,
      libheifJs: decoderRequire('libheif-js/package.json').version,
    };
    const pool = require(path.join(appRoot, 'node_modules/workerpool')).pool(
      path.join(appRoot, 'out/app/src-main/thumbnail-generation/generate-thumbnail-file-worker.js'),
      { workerType: 'process', maxWorkers: 1 });
    const source = path.join(root, 'test/e2e/fixtures/demo.heic');
    const output = path.join(profile, 'thumbnail.jpg');
    try {
      const good = await pool.exec('generateThumbnailFile', [{ srcFilePath: source, outputFileDir: profile, outputFilePath: output }]);
      const jpeg = require(path.join(appRoot, 'node_modules/jpeg-js')).decode(fs.readFileSync(output));
      const bad = await pool.exec('generateThumbnailFile', [{ srcFilePath: path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), outputFileDir: profile, outputFilePath: output }]);
      return { good, bad, decoderVersions, width: jpeg.width, height: jpeg.height,
        pixels: require('node:crypto').createHash('sha256').update(jpeg.data).digest('hex') };
    } finally { await pool.terminate(); }
  }, { root, profile });
  expect(result.good.status).toBe('success');
  expect(result.good.error).toBeUndefined();
  expect(result.bad.status).toBe('failed-in-heic-convert');
  // What was thrown comes back as "Name: message", for the main process to record without paths.
  expect(result.bad.error).toMatch(/^\w*Error: \S/);
  expect(Math.max(result.width, result.height)).toBe(400);
  expect(result.width).toBeGreaterThan(0);
  expect(result.decoderVersions).toEqual({ heicDecode: '2.1.0', libheifJs: '1.23.5' });
  // The owner-approved decoder output has its own strict reference. The original
  // baseline remains unchanged; parsed JSON also avoids Git's Windows CRLF effect.
  expect({ width: result.width, height: result.height, pixels: result.pixels })
    .toEqual(require('./approved-references/heic-thumbnail-libheif-1.23.5.json'));
});
test('a HEIF thumbnail that cannot be made is recorded with why, without paths', async () => {
  // "Thumbnail Generation Finished" says only how many failed; this says why, once per reason.
  const folder = path.join(profile, 'thumbnails that fail');
  await mkdir(folder);
  await copyFile(path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), path.join(folder, 'Not a HEIF.HEIC'));
  // A photo with location data, or a dialog saying there is none covers the welcome dialog.
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  const previousOpen = process.env.PLM_E2E_OPEN;
  try {
    process.env.PLM_E2E_OPEN = folder;
    await app.close();
    await launch();
    await dismissWelcome();
    const failures = () => app.evaluate(() => globalThis.__plmAnalyticsEvents.filter(event =>
      event.service === 'amplitude' && event.action === 'Thumbnail Generation Failed'));
    await expect.poll(failures, { timeout: 30000 }).toHaveLength(1);
    const [failure] = await failures();
    expect(failure).toMatchObject({ category: 'Thumbnail Generation', value: 'Files: 1' });
    expect(failure.label).toMatch(/^failed-in-heic-convert: \w*Error: \S/);
    expect(failure.label).not.toContain(profile);
    expect(failure.label).not.toContain('Not a HEIF');
  } finally {
    if (previousOpen === undefined) delete process.env.PLM_E2E_OPEN;
    else process.env.PLM_E2E_OPEN = previousOpen;
  }
});
test('the thumbnail status bar follows the generation of HEIF thumbnails from start to end', async () => {
  // The main process makes the thumbnails, and the status bar learns of them from a poll every 5 seconds.
  const folder = path.join(profile, 'HEIF to make thumbnails of');
  await mkdir(folder);
  await copyFile(path.join(root, 'test/e2e/fixtures/demo.heic'), path.join(folder, 'demo.heic'));
  // A photo with location data, or a dialog saying there is none covers the window.
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  await dismissWelcome();
  const statusBar = page.locator('app-thumbnail-generation-status-bar');
  await expect(statusBar).toBeHidden();
  await openFolderWithPicker(folder);
  await expect(statusBar).toBeVisible();
  await expect(statusBar).toContainText('Generating thumbnails for HEIF files...');
  const openFolderButton = page.getByRole('button', { name: 'Open Folder', exact: true });
  await expect(openFolderButton).toBeDisabled();
  await expect(statusBar).toContainText('Completed generating thumbnails for HEIF files.', { timeout: 30000 });
  await expect(statusBar).toContainText('Processed 1 out of 1 files.');
  await expect(openFolderButton).toBeEnabled();
  // The photo's row of the tree shows the thumbnail that was made, from the cache, in place of the image that
  // stood in for it.
  const thumbnail = page.locator('mat-tree-node').filter({ hasText: 'demo.heic' }).locator('.photo-info-viewer-thumbnail');
  await expect(thumbnail).toHaveAttribute('src', /demo\.heic\.plm\.jpg$/);
  await expect(thumbnail).not.toHaveClass(/photo-info-viewer-generating-thumbnail/);
  await expect.poll(() => thumbnail.evaluate(image => image.complete && image.naturalWidth)).toBeGreaterThan(0);
  await statusBar.getByTitle('Close Thumbnail Generation Status Bar').click();
  await expect(statusBar).toBeHidden();
});
test('opening another folder hides the thumbnail status bar of the previous one', async () => {
  // Every open hides it, the second one too, although the application then already has a folder open.
  const folder = path.join(profile, 'HEIF before another folder');
  await mkdir(folder);
  await copyFile(path.join(root, 'test/e2e/fixtures/demo.heic'), path.join(folder, 'demo.heic'));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  const statusBar = page.locator('app-thumbnail-generation-status-bar');
  await expect(statusBar).toContainText('Completed generating thumbnails for HEIF files.', { timeout: 30000 });
  await expect(statusBar).toBeVisible();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expect(statusBar).toBeHidden();
});
test('the thumbnail error dialog lists, sorts and filters the HEIF files without a thumbnail', async () => {
  // Its table gets its rows from ng-table-virtual-scroll, which says nothing about zoneless Angular.
  const folder = path.join(profile, 'HEIF without thumbnails');
  await mkdir(folder);
  for (const name of ['A broken.HEIC', 'B broken.HEIC'])
    await copyFile(path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), path.join(folder, name));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  const statusBar = page.locator('app-thumbnail-generation-status-bar');
  await expect(statusBar).toContainText('Finished generating thumbnails for HEIF files with errors.', { timeout: 30000 });
  // The link is in the details, which a click on the progress bar opens.
  const details = statusBar.locator('.progress-bar-with-details');
  await details.click();
  await expect(details).toHaveClass(/expanded-progress-bar-with-details/);
  await statusBar.getByText('Click here to see the files with errors.').click();
  const dialog = page.locator('app-thumbnail-generation-error-dialog');
  await expect(dialog).toContainText('Failed to generate thumbnails for the following 2 files:');
  const fileNames = async () => (await dialog.locator('tr[mat-row] .file-path').allTextContents())
    .map(text => path.basename(text.trim()));
  await expect.poll(fileNames).toHaveLength(2);
  const fileHeader = dialog.locator('th').filter({ hasText: 'File' });
  await fileHeader.click();
  await expect.poll(fileNames).toEqual(['A broken.HEIC', 'B broken.HEIC']);
  await fileHeader.click();
  await expect.poll(fileNames).toEqual(['B broken.HEIC', 'A broken.HEIC']);
  await dialog.getByPlaceholder('Filter').pressSequentially('A broken');
  await expect.poll(fileNames).toEqual(['A broken.HEIC']);
  // Its buttons open the file and its folder with the OS, which nothing does here.
  const openCommands = await recordOpenCommands();
  const row = dialog.locator('tr[mat-row]').filter({ hasText: 'A broken.HEIC' });
  await row.getByRole('button', { name: 'Open File', exact: true }).click();
  await row.getByRole('button', { name: 'Open Folder', exact: true }).click();
  const brokenFile = path.join(folder, 'A broken.HEIC');
  await expect.poll(openCommands).toEqual([osOpenCommand(brokenFile), osOpenCommand(brokenFile, { containingFolder: true })]);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});
/** The value of a setting in the test profile's files, or undefined. */
async function savedSetting(userData, storagePath) {
  const file = path.join(userData, 'PhotoLocationMapStorage', ...storagePath.slice(0, -1), `${storagePath.at(-1)}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8'))[storagePath.at(-1)];
  } catch {
    return undefined;
  }
}
/**
 * The ID of the app's main process, which the launch report records. Not app.process().pid: on Windows, Playwright
 * starts the app through a shell (cmd.exe), whose ID that is, and the report's only line was then the app's own,
 * which waitForRealRelaunch took for the relaunched app's (CI, before this was used).
 */
function mainProcessId() {
  return app.evaluate(() => process.pid);
}
/**
 * Waits until the application, asked to restart, has quit and launched again by itself, and returns the relaunched
 * process's line of the launch report (PLM_TEST_LAUNCH_REPORT, electron-util/e2e-test-hooks.js), once its home view
 * has rendered. The relaunched process is not under the test's control, so it is stopped here.
 */
async function waitForRealRelaunch(report, exited, pid) {
  await exited;
  let relaunched;
  try {
    await expect.poll(async () => {
      const lines = (await readFile(report, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(line => JSON.parse(line));
      relaunched = lines.find(line => line.pid !== pid);
      return !!relaunched;
    }, { timeout: 60000, message: 'The app did not launch again by itself.' }).toBe(true);
    process.kill(relaunched.pid, 'SIGTERM');
  } catch (error) {
    throw new Error(`${error.message}\n${await relaunchDiagnostics(report, pid, relaunched)}`, { cause: error });
  }
  await expect.poll(() => { try { process.kill(relaunched.pid, 0); return true; } catch { return false; } }, { timeout: 15000 }).toBe(false);
  return relaunched;
}
/**
 * What the profile tells of a relaunch that went wrong: the launch report's processes, and the end of each launch's
 * log (src-main/log/log-setup.ts), which the test profile keeps under its appData.
 */
async function relaunchDiagnostics(report, pid, relaunched) {
  const launches = (await readFile(report, 'utf8').catch(() => '')).split('\n').filter(Boolean)
    .map(line => JSON.parse(line)).map(({ pid, ppid, reportedAtMs }) => ({ pid, ppid, reportedAtMs }));
  const logs = path.join(profile, 'appData', 'Photo Location Map', 'logs');
  const { readdir } = await import('node:fs/promises');
  const tails = [];
  for (const name of (await readdir(logs).catch(() => [])).sort()) {
    const lines = (await readFile(path.join(logs, name), 'utf8').catch(() => '')).trimEnd().split(/\r?\n/);
    tails.push(`--- ${name}, its last ${Math.min(lines.length, 40)} of ${lines.length} lines:`, ...lines.slice(-40));
  }
  return [`Quit: pid ${pid}. Relaunched: ${relaunched ? `pid ${relaunched.pid}` : 'none reported'}. Now: ${Date.now()}.`,
    `Launch report: ${JSON.stringify(launches)}`, ...(tails.length ? tails : ['No log file.'])].join('\n');
}
test('settings changed just before quitting are saved', async () => {
  // A renderer's writes go to the main process, which writes the files: one sent before the quit is written.
  const userData = await app.evaluate(({ app }) => app.getPath('userData'));
  await dismissWelcome();
  await page.locator('.more-options-button').click();
  await page.locator('button[mat-menu-item]').filter({ hasText: 'Sort' }).click();
  await page.locator('button[mat-menu-item]').filter({ hasText: 'Descending' }).click();
  const exited = new Promise(resolve => app.process().once('exit', resolve));
  await app.evaluate(({ app }) => app.quit());
  await exited;
  expect(await savedSetting(userData, ['History', 'ClickedOkOnWelcomeDialog'])).toBe('true');
  expect(await savedSetting(userData, ['DirectoryTreeView', 'SortDirection'])).toBe('Descending');
  await launch();
  await expect(page.locator('app-welcome-dialog')).toHaveCount(0);
});
test('a new date format is written before the app relaunches itself, and the relaunched app reads it', async () => {
  const report = path.join(profile, 'launches.jsonl');
  await app.close();
  await launch({ env: { PLM_TEST_LAUNCH_REPORT: report } });
  const userData = await app.evaluate(({ app }) => app.getPath('userData'));
  await dismissWelcome();
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
  await page.getByRole('combobox', { name: 'Date Format' }).click();
  await page.getByRole('option', { name: 'DD/MM/YYYY', exact: true }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  // Taken before the click: once the app has quit, Playwright no longer has its process.
  const pid = await mainProcessId();
  const exited = new Promise(resolve => app.process().once('exit', resolve));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('app-confirm-dialog').getByRole('button', { name: 'OK', exact: true }).click();
  const relaunched = await waitForRealRelaunch(report, exited, pid);
  expect(relaunched.rendererMarks.some(mark => mark.name === 'plm:renderer:home-rendered')).toBe(true);
  expect(await savedSetting(userData, ['UserSettings', 'DateFormat'])).toBe('DD/MM/YYYY');
  await launch();
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
  await expect(page.getByRole('combobox', { name: 'Date Format' })).toContainText('DD/MM/YYYY');
});
test('deleting the thumbnail cache empties it before the app relaunches itself', async () => {
  const report = path.join(profile, 'launches.jsonl');
  await app.close();
  await launch({ env: { PLM_TEST_LAUNCH_REPORT: report } });
  await dismissWelcome();
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Cache' }).click();
  const cacheFolder = (await page.locator('app-cache-settings .location-value').textContent()).trim();
  await mkdir(path.join(cacheFolder, 'some', 'folder'), { recursive: true });
  await writeFile(path.join(cacheFolder, 'some', 'folder', 'IMG_0001.HEIC.plm.jpg'), 'thumbnail');
  const pid = await mainProcessId();
  const exited = new Promise(resolve => app.process().once('exit', resolve));
  await page.getByRole('button', { name: 'Delete Thumbnail Cache', exact: true }).click();
  await page.locator('app-confirm-dialog').getByRole('button', { name: 'OK', exact: true }).click();
  await waitForRealRelaunch(report, exited, pid);
  const { readdir } = await import('node:fs/promises');
  expect(await readdir(cacheFolder)).toEqual([]);
  await launch();
});
for (const [name, fixture, specialPath] of [
  ['JPEG', 'actual-photos/Kobe/IMG_4676.JPG'],
  ['HEIC', '../../e2e/fixtures/demo.heic'],
  ['JPEG', 'actual-photos/Kobe/IMG_4676.JPG', true],
  ['HEIC', '../../e2e/fixtures/demo.heic', true],
]) {
  test(`embedded Photo Data Viewer loads a real local ${name} through the app${specialPath ? ' with Unicode, spaces, # and % in its path' : ''}`, async () => {
    await dismissWelcome();
    let photo = name === 'HEIC' ? path.join(root, 'test/e2e/fixtures/demo.heic') : path.join(root, 'test/test-resources', fixture);
    if (specialPath) {
      const folder = path.join(profile, 'viewer 写真 # 100%');
      await mkdir(folder);
      const copiedPhoto = path.join(folder, `画像 # 50% ${name}${path.extname(photo)}`);
      await copyFile(photo, copiedPhoto);
      photo = copiedPhoto;
    }
    // The viewer may open only a photo of a folder that the user opened (src-main/photo-data-viewer/).
    await openFolderWithPicker(path.dirname(photo));
    const newWindow = app.waitForEvent('window');
    await page.evaluate(({ name, photo }) => window.plm.photoDataViewer.open({ photo: { name, path: photo } }),
      { name: path.basename(photo), photo });
    const viewer = await newWindow;
    await expect(viewer.locator('img[alt]').filter({ hasNotText: 'dummy' }).first()).toBeVisible({ timeout: 30000 });
    await viewer.waitForFunction(() => [...document.querySelectorAll('img')].some(img => img.naturalWidth > 100), { timeout: 30000 });
    await expect(viewer).toHaveTitle(`${path.basename(photo)} - Photo Location Map`);
    // The viewer calls show() once loaded; its window, too, must stay off the screen in a headless run.
    const viewerWindow = await app.browserWindow(viewer);
    await expectWindowOffScreenOnlyIfHeadless(viewerWindow);
    // Isolated as the main window is, the page gets the photo from its bridge, without its path, which no longer goes
    // to the viewer's server in the address.
    expect(await viewerWindow.evaluate(window => {
      const applied = window.webContents.getLastWebPreferences();
      return [applied.contextIsolation, applied.nodeIntegration, applied.sandbox];
    })).toEqual([true, false, true]);
    expect(await viewer.evaluate(() => [typeof window.require, typeof window.process])).toEqual(['undefined', 'undefined']);
    expect(new URL(viewer.url()).searchParams.get('photoPath')).toBeNull();
    expect(new URL(viewer.url()).searchParams.get('plmBridge')).toBe('1');
    // The photo's URL is the viewer's alone: the main window's page cannot read it, and it ends with the window.
    const { url } = await viewer.evaluate(() => window.plmPhotoDataViewer.readPhoto());
    expect(url).toMatch(/^plm-photo:\/\/photo\/[0-9a-f]{64}$/);
    expect(await page.evaluate(url => fetch(url).then(answer => answer.status, error => error.message), url)).not.toBe(200);
    const status = () => app.evaluate(async ({ app }, { url, referrer }) => {
      const require = globalThis.__plmTestRequire;
      const delivery = require(require('node:path').join(app.getAppPath(), 'out/app/src-main/photo-data-viewer/photo-delivery.js'));
      // What protocol.handle passes for the viewer's fetch(): the URL, the mode and the referrer that Chromium sets.
      const request = { url, mode: 'cors', referrer, headers: new Headers() };
      return (await delivery.respondToPhotoRequest(request)).status;
    }, { url, referrer: `${new URL(viewer.url()).origin}/` });
    expect(await status()).toBe(200);
    await viewerWindow.evaluate(window => new Promise(resolve => { window.once('closed', resolve); window.close(); }));
    expect(await status()).toBe(404);
  });
}
test('download website keeps desktop and narrow layouts and Windows navigation', async () => {
  test.skip(!!packagedExecutable, 'The static website is verified separately from the packaged application.');
  // In a window of its own, without the app's preload: the main window shows the app's page only
  // (src-main/ipc/main-window-pages.ts). The size is the main window's in the other cases.
  const websiteWindow = app.waitForEvent('window');
  await app.evaluate(({ app, BrowserWindow }, url) => {
    // Off the screen in a headless run, as the app's windows are (electron-util/e2e-test-hooks.js).
    const require = globalThis.__plmTestRequire;
    const { withHeadlessTestOptions } = require(require('node:path').join(app.getAppPath(), 'out/app/electron-util/e2e-test-hooks.js'));
    const window = new BrowserWindow(withHeadlessTestOptions({ useContentSize: true, width: 1200, height: 800 }));
    void window.loadURL(url);
  }, pathToFileURL(path.join(root, 'docs/index.html')).href);
  page = await websiteWindow;
  const setContentSize = (width, height) => app.evaluate(({ BrowserWindow }, [width, height]) =>
    BrowserWindow.getAllWindows().find(window => window.webContents.getURL().includes('/docs/')).setContentSize(width, height), [width, height]);
  await expect(page.locator('.title')).toHaveText('Photo Location Map');
  await expect(page.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', 'github-pages/downloading-for-windows/downloading-for-windows.html');
  await shot('website-desktop', [page.locator('iframe')]);
  await setContentSize(600, 800);
  await shot('website-narrow', [page.locator('iframe')]);
  const macDownload = page.getByRole('button', { name: 'Download for macOS' });
  await macDownload.focus();
  await expect(macDownload).toHaveCSS('background-color', 'rgb(52, 58, 64)');
  await expect(macDownload).toHaveCSS('box-shadow', 'rgba(82, 88, 93, 0.5) 0px 0px 0px 3.2px');
  await macDownload.hover();
  await expect(macDownload).toHaveCSS('background-color', 'rgb(35, 39, 43)');
  await macDownload.click();
  await expect.poll(() => app.evaluate(() => globalThis.__plmDownloads.some(url => url.endsWith('-universal.dmg')))).toBe(true);
  await setContentSize(390, 800);
  expect(await page.locator('.download-buttons').evaluate(el => getComputedStyle(el).flexDirection)).toBe('column');
  await page.getByRole('link', { name: 'Download for Windows' }).click();
  await expect(page).toHaveURL(/downloading-for-windows\.html$/);
  await expect.poll(() => app.evaluate(() => globalThis.__plmDownloads.some(url => url.endsWith('.exe')))).toBe(true);
});
