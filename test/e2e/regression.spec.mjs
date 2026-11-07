import { test, expect, _electron } from 'playwright/test';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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
// components and zoneless change detection would not render (see src/main.ts). A production build checks nothing.
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
/** Launches the application on the test profile, finds its main window as `page`, and checks how it runs. */
async function launch({ resize = true } = {}) {
  const env = { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: headless ? '1' : '0' };
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
    args: packagedExecutable ? openArgs : ['test/e2e/main.cjs', ...openArgs],
    cwd: packagedExecutable ? profile : root, env, timeout: packagedExecutable ? 90000 : 30000 });
  // Listened to for every page from the launch on, so that what the first change detection reports is not missed.
  app.context().on('console', message => {
    if (message.type() === 'error' && message.text().includes('NG0100')) changedWithoutNotification.push(message.text());
  });
  app.context().on('weberror', webError => {
    if (webError.error().message.includes('NG0100')) changedWithoutNotification.push(webError.error().message);
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
      prod: require(path.join(appRoot, 'src-shared/dev-or-prod/dev-or-prod.js')).DevOrProd.isProd,
      unitTest: require(path.join(appRoot, 'src-shared/environment/environment-detector.js')).EnvironmentDetector.isUnitTest,
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
    expect(await realpath(runtime.appRoot)).toBe(await realpath(path.join(runtime.resources, 'app')));
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
  await page.waitForSelector('app-root app-home');
  if (liveReload) expect(new URL(page.url()).origin).toBe('http://localhost:4200');
  await page.waitForFunction(() => !!window.plmInternalRenderer?.settingsDialog?.showSettingsDialog);
  await expect(page.locator('.leaflet-pm-toolbar').first()).toBeVisible();
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll('img.leaflet-tile')];
    return tiles.length > 0 && tiles.every(img => img.complete);
  });
}
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
  const dialog = name === 'welcome' || name === 'about' || name.startsWith('settings-')
    ? page.locator('mat-dialog-container') : page;
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
async function settings() {
  await page.evaluate(() => window.plmInternalRenderer.settingsDialog.showSettingsDialog());
  await expect(page.locator('app-settings-dialog')).toBeVisible();
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
/** Records the URLs that the app opens in the OS browser, instead of opening them. */
async function recordOpenedUrls() {
  await page.evaluate(() => {
    window.__plmOpenedUrls = [];
    window.require('electron').shell.openExternal = async url => { window.__plmOpenedUrls.push(url); };
  });
  return () => page.evaluate(() => window.__plmOpenedUrls);
}
/** Records the commands that open files and folders with the OS, such as `open "<path>"`, instead of running them. */
async function recordOpenCommands() {
  await page.evaluate(() => {
    window.__plmOpenCommands = [];
    window.require('child_process').spawn = command => { window.__plmOpenCommands.push(command); return { on() {} }; };
  });
  return () => page.evaluate(() => window.__plmOpenCommands);
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
test.afterEach(async () => {
  const child = app?.process();
  let timer;
  try {
    // A development build checks every view each second (src/main.ts): let one more check run, after the case's last
    // step, before the application closes.
    if (page && !page.isClosed() && await page.evaluate(() => !!globalThis.ngDevMode).catch(() => false))
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
    if (profile) await rm(profile, { recursive: true, force: true });
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
  await shot('settings-appearance');
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
  await shot('settings-date', [page.locator('.date-time-example')]);
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Cache' }).click();
  await shot('settings-cache', [page.locator('.location-value')]);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
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
    'Open the troubleshooting page', 'Open Home Page', 'View Source Code in GitHub']) {
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
    'https://github.com/TomoyukiAota', troubleshooting, 'https://tomoyukiaota.github.io/photo-location-map/',
    'https://github.com/TomoyukiAota/photo-location-map',
    'https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format',
  ]);
});
test('the cache settings open the cache folder, and ask before deleting the cache', async () => {
  // Deleting restarts the app once confirmed, so the question is declined. window.confirm is replaced, as Electron
  // would show it in a window of its own.
  await dismissWelcome();
  const openCommands = await recordOpenCommands();
  await page.evaluate(() => {
    window.__plmConfirmMessages = [];
    window.confirm = message => { window.__plmConfirmMessages.push(message); return false; };
  });
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Cache' }).click();
  const location = page.locator('app-cache-settings .location-value');
  const cacheFolder = (await location.textContent()).trim();
  expect(cacheFolder.startsWith(profile)).toBe(true);
  await location.click();
  await expect.poll(openCommands).toEqual([expect.stringContaining(`"${cacheFolder}"`)]);
  await page.getByRole('button', { name: 'Delete Thumbnail Cache', exact: true }).click();
  expect(await page.evaluate(() => window.__plmConfirmMessages))
    .toEqual(['This application will restart after deleting the thumbnail cache.\nDo you want to continue?']);
  await expect(page.locator('app-settings-dialog')).toBeVisible();
});
test('appearance setting saves, affects layout, and survives a real app restart', async () => {
  await dismissWelcome();
  await settings();
  const checkbox = page.getByRole('checkbox', { name: 'Show Status Bar' });
  const before = await checkbox.isChecked();
  await checkbox.setChecked(!before);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await app.close();
  await launch();
  await expect(page.locator('app-welcome-dialog')).toHaveCount(0);
  await settings();
  await expect(page.getByRole('checkbox', { name: 'Show Status Bar' })).toBeChecked({ checked: !before });
  await page.getByRole('checkbox', { name: 'Show Status Bar' }).setChecked(before);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await settings();
  await expect(page.getByRole('checkbox', { name: 'Show Status Bar' })).toBeChecked({ checked: !before });
});
test('Show Status Bar shows and hides the loaded-files status bar while it is changed, and Cancel restores it', async () => {
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  const statusBar = page.locator('app-loaded-files-status-bar');
  await expect(statusBar).toContainText('4 files have location data.');
  await expect(statusBar).toBeVisible();
  const showStatusBar = page.getByRole('checkbox', { name: 'Show Status Bar' });
  await settings();
  await showStatusBar.uncheck();
  await expect(statusBar).toBeHidden();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await expect(statusBar).toBeVisible();
  await settings();
  await showStatusBar.uncheck();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await expect(statusBar).toBeHidden();
});
test('Save is enabled only while a setting differs, and a new date format asks before the restart that saving it needs', async () => {
  await dismissWelcome();
  await settings();
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

  // Saving asks first. Declined, nothing is saved and the dialog stays. window.confirm is replaced, as Electron would
  // show it in a window of its own.
  await chooseDateFormat('DD/MM/YYYY');
  await page.evaluate(() => {
    window.__plmConfirmMessages = [];
    window.confirm = message => { window.__plmConfirmMessages.push(message); return false; };
  });
  await save.click();
  expect(await page.evaluate(() => window.__plmConfirmMessages))
    .toEqual(['This application will restart after saving settings.\nDo you want to continue?']);
  await expect(page.locator('app-settings-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await settings();
  await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
  await expect(dateFormat).toContainText('YYYY-MM-DD');
  await expect(save).toBeDisabled();
});
test('the Map menu switches to Google Maps, which draws the selected photos, and back to OpenStreetMap', async () => {
  // Google Maps needs an API key and Google's servers, so a stand-in for its API counts the markers of each map drawn.
  await page.route(url => url.hostname === 'maps.google.com', route => route.fulfill({
    contentType: 'text/javascript',
    // In a function, so that its classes do not hide the page's own Map.
    body: `(() => {
      const markerCounts = window.__plmGoogleMapsMarkerCounts = [];
      window.google = { maps: {
        Map: class {
          constructor() { this.index = markerCounts.push(0) - 1; }
          fitBounds() {}
          getZoom() { return 10; }
          setZoom() {}
        },
        Marker: class {
          constructor({ position, map }) { this.position = position; markerCounts[map.index]++; }
        },
        MapTypeId: { ROADMAP: 'roadmap' },
        LatLng: class { constructor(lat, lng) { this.lat = lat; this.lng = lng; } },
        LatLngBounds: class { extend() {} },
        InfoWindow: class { setContent() {} open() {} },
        event: { addListener() {}, addListenerOnce() {} },
      } };
    })();`,
  }));
  // The Map menu is shown in development only, so its items are clicked from the main process.
  async function chooseMap(label) {
    await app.evaluate(({ Menu }, label) => {
      const find = items => items.reduce((found, item) =>
        found ?? (item.label.startsWith(label) ? item : item.submenu && find(item.submenu.items)), undefined);
      find(Menu.getApplicationMenu().items).click();
    }, label);
  }
  const lastGoogleMapsMarkerCount = () => page.evaluate(() => window.__plmGoogleMapsMarkerCounts?.at(-1));
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expectRepresentedPhotos(4);

  await chooseMap('[Experimental] Google Maps');
  await expect(page.locator('app-google-maps #google-map')).toBeAttached();
  await expect(page.locator('app-leaflet-map')).toHaveCount(0);
  await expect.poll(lastGoogleMapsMarkerCount).toBe(4);
  await treeCheckbox('Kobe').uncheck();
  await expect.poll(lastGoogleMapsMarkerCount).toBe(3);

  await chooseMap('OpenStreetMap');
  await expect(page.locator('app-leaflet-map')).toBeVisible();
  await expect(page.locator('app-google-maps')).toHaveCount(0);
  await expectRepresentedPhotos(3);

  // The API has loaded by the second switch, which creates one map for the pinned photos, not two: each map created
  // uses the API's quota.
  const mapsBefore = await page.evaluate(() => window.__plmGoogleMapsMarkerCounts.length);
  await chooseMap('[Experimental] Google Maps');
  await expect.poll(lastGoogleMapsMarkerCount).toBe(3);
  expect(await page.evaluate(() => window.__plmGoogleMapsMarkerCounts.length)).toBe(mapsBefore + 1);
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
  const readChartTheme = () => chart.evaluate(element => {
    if (typeof window.__plmReadChartTheme !== 'function') throw new Error('The fixed E2E chart-theme hook is unavailable.');
    return window.__plmReadChartTheme(element);
  });
  const chartTheme = await readChartTheme();
  console.info('Resolved chart theme:', JSON.stringify(chartTheme));
  expect(chartTheme.api).toEqual({ init: 'function', getInstanceByDom: 'function', registerTheme: 'function' });
  await expect.poll(async () => (await readChartTheme()).palette?.[0]).toBe('#5470c6');
  const unit = page.locator('app-date-time-taken-chart-config select');
  await expect(unit).toHaveValue('Day');
  // Hours cannot show photos taken years apart: the chart says so, until a unit that can is chosen.
  const unsupported = page.locator('app-date-time-taken-chart .unsupported-message');
  await expect(unsupported).toBeHidden();
  await unit.selectOption('Hour');
  await expect(unsupported).toContainText('does not support showing more than 30 days when Hour is selected');
  await unit.selectOption('Year');
  await expect(unit).toHaveValue('Year');
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
  const { jpegWithLocationOnly } = require('../test-util/jpeg-with-location-only.cjs');
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
test('a right-click outside the tree\'s context menu closes it', async () => {
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  // The menu listens to the first overlay backdrop, which is the loading dialog's until that has closed.
  await expect(page.locator('.cdk-overlay-backdrop')).toHaveCount(0);
  const selectOnlyThis = page.getByRole('menuitem', { name: 'Select Only This' });
  await page.locator('mat-tree-node').filter({ hasText: 'Kobe' }).click({ button: 'right' });
  await expect(selectOnlyThis).toBeVisible();
  await page.locator('.cdk-overlay-backdrop').click({ button: 'right', position: { x: 5, y: 5 } });
  await expect(selectOnlyThis).toHaveCount(0);
  await expect(treeCheckbox('Kobe')).toBeChecked();
});
test('Select Only This from a marker popup selects that photo in the tree and on the map', async () => {
  // The popup and its menu are plain DOM that Leaflet shows, outside Angular.
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
  const { jpegWithEmptyGpsValues } = require('../test-util/jpeg-with-empty-gps-values.cjs');
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
    const { Analytics } = require(require('node:path').join(app.getAppPath(), 'src-shared/analytics/analytics.js'));
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
      const sdk = window.require('@amplitude/analytics-browser').createInstance();
      await sdk.init('00000000000000000000000000000000', 'compatibility-user', {
        fetchRemoteConfig: false, enableDiagnostics: false
      }).promise;
      sdk.flush();
    });
  }
  const userId = await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    const path = require('node:path');
    const { Analytics } = require(path.join(app.getAppPath(), 'src-shared/analytics/analytics.js'));
    const { AnalyticsConfig } = require(path.join(app.getAppPath(), 'src-shared/analytics/config/analytics-config.js'));
    Analytics.trackEvent('Compatibility', 'Dependency Upgrade Check', 'fixed label', 17);
    return AnalyticsConfig.userId;
  });
  if (process.env.PLM_ANALYTICS_URL_NEGATIVE_CONTROL) {
    await page.evaluate(async ({ userId, enrichmentOnly }) => {
      const sdk = window.require('@amplitude/analytics-browser').createInstance();
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
      path.join(appRoot, 'src-main/thumbnail-generation/generate-thumbnail-file-worker.js'),
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
  const brokenFile = `"${path.join(folder, 'A broken.HEIC')}"`;
  await expect.poll(openCommands).toEqual([expect.stringContaining(brokenFile), expect.stringContaining(brokenFile)]);
  const [openFile, openFolder] = await openCommands();
  expect(openFile).not.toBe(openFolder);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toHaveCount(0);
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
    const newWindow = app.waitForEvent('window');
    await page.evaluate(({ name, photo }) => window.require('electron').ipcRenderer.invoke(
      'ipc-constants-launch-photo-data-viewer', { photo: { name, path: photo } }), { name: path.basename(photo), photo });
    const viewer = await newWindow;
    await expect(viewer.locator('img[alt]').filter({ hasNotText: 'dummy' }).first()).toBeVisible({ timeout: 30000 });
    await viewer.waitForFunction(() => [...document.querySelectorAll('img')].some(img => img.naturalWidth > 100), { timeout: 30000 });
    await expect(viewer).toHaveTitle(`${path.basename(photo)} - Photo Location Map`);
    // The viewer calls show() once loaded; its window, too, must stay off the screen in a headless run.
    await expectWindowOffScreenOnlyIfHeadless(await app.browserWindow(viewer));
    expect(new URL(viewer.url()).searchParams.get('photoPath')).toBe(photo);
  });
}
test('download website keeps desktop and narrow layouts and Windows navigation', async () => {
  test.skip(!!packagedExecutable, 'The static website is verified separately from the packaged application.');
  await page.goto(pathToFileURL(path.join(root, 'docs/index.html')).href);
  await expect(page.locator('.title')).toHaveText('Photo Location Map');
  await expect(page.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', 'github-pages/downloading-for-windows/downloading-for-windows.html');
  await shot('website-desktop', [page.locator('iframe')]);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(600, 800));
  await shot('website-narrow', [page.locator('iframe')]);
  const macDownload = page.getByRole('button', { name: 'Download for macOS' });
  await macDownload.focus();
  await expect(macDownload).toHaveCSS('background-color', 'rgb(52, 58, 64)');
  await expect(macDownload).toHaveCSS('box-shadow', 'rgba(82, 88, 93, 0.5) 0px 0px 0px 3.2px');
  await macDownload.hover();
  await expect(macDownload).toHaveCSS('background-color', 'rgb(35, 39, 43)');
  await macDownload.click();
  await expect.poll(() => app.evaluate(() => globalThis.__plmDownloads.some(url => url.endsWith('-universal.dmg')))).toBe(true);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(390, 800));
  expect(await page.locator('.download-buttons').evaluate(el => getComputedStyle(el).flexDirection)).toBe('column');
  await page.getByRole('link', { name: 'Download for Windows' }).click();
  await expect(page).toHaveURL(/downloading-for-windows\.html$/);
  await expect.poll(() => app.evaluate(() => globalThis.__plmDownloads.some(url => url.endsWith('.exe')))).toBe(true);
});
