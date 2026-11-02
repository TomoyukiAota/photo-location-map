import { test, expect, _electron } from 'playwright/test';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, realpath, rm } from 'node:fs/promises';
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
let app, page, profile;
async function launch({ resize = true } = {}) {
  const env = { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1' };
  for (const key of ['PLM_EM_MAIN', 'PLM_EM_RENDERER', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS']) delete env[key];
  // A publicly launched package has no npm development-profile override.
  if (packagedExecutable) delete env.npm_package_config_devOrProd;
  const openArgs = [
    ...(liveReload ? ['--live-reload'] : []),
    ...(process.env.PLM_E2E_OPEN ? ['--open', process.env.PLM_E2E_OPEN] : []),
  ];
  app = await _electron.launch({ executablePath: packagedLauncher || packagedExecutable || require('electron'),
    args: packagedExecutable ? openArgs : ['test/e2e/main.cjs', ...openArgs],
    cwd: packagedExecutable ? profile : root, env, timeout: packagedExecutable ? 90000 : 30000 });
  const runtime = await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    if (typeof require !== 'function') throw new Error('The application is missing its gated E2E hooks; rebuild it before testing.');
    const path = require('node:path');
    const appRoot = app.getAppPath();
    return { packaged: app.isPackaged, appRoot, resources: process.resourcesPath, executable: process.execPath,
      appImage: process.env.APPIMAGE, version: app.getVersion(), versions: process.versions,
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
test.beforeEach(async () => {
  if (packagedExecutable) test.setTimeout(120000);
  if (test.info().config.updateSnapshots !== 'none') {
    expect(require('../../node_modules/@angular/core/package.json').version).toBe('18.2.4');
    expect(require('../../node_modules/electron/package.json').version).toBe('32.0.2');
  }
  profile = await mkdtemp(path.join(tmpdir(), 'plm-e2e-'));
  await launch();
});
test.afterEach(async () => {
  const child = app?.process();
  let timer;
  try {
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
    await rm(profile, { recursive: true, force: true });
  }
});
test('welcome, about and every available settings tab keep their appearance', async () => {
  await expect(page.locator('app-welcome-dialog')).toContainText('Version 1.12.2-alpha');
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
  await expect(unit).toHaveValue('Day');
  await unit.selectOption('Year');
  await expect(unit).toHaveValue('Year');
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
test('analytics keeps explicit event properties and adds no automatic interaction events', async () => {
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
  await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    const { Analytics } = require(require('node:path').join(app.getAppPath(), 'src-shared/analytics/analytics.js'));
    Analytics.trackEvent('Compatibility', 'Dependency Upgrade Check', 'fixed label', 17);
  });
  await settings();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents.filter(event =>
      event.service === service && event.action === 'Dependency Upgrade Check'), service), { timeout: 20000 }).toEqual([
      { service, action: 'Dependency Upgrade Check', category: 'Compatibility', label: 'fixed label', value: 17 }
    ]);
  }
  const actions = await app.evaluate(() => globalThis.__plmAnalyticsEvents.map(event => event.action));
  expect(actions.filter(action => /^\[Amplitude\]|^\$mp_|^session_(start|end)$/.test(action))).toEqual([]);
});
test('HEIC worker generates the same bounded JPEG and reports corrupt input', async () => {
  const result = await app.evaluate(async ({ app }, { root, profile }) => {
    const require = globalThis.__plmTestRequire;
    const path = require('node:path');
    const fs = require('node:fs');
    const appRoot = app.getAppPath();
    const pool = require(path.join(appRoot, 'node_modules/workerpool')).pool(
      path.join(appRoot, 'src-main/thumbnail-generation/generate-thumbnail-file-worker.js'),
      { workerType: 'process', maxWorkers: 1 });
    const source = path.join(root, 'test/e2e/fixtures/demo.heic');
    const output = path.join(profile, 'thumbnail.jpg');
    try {
      const good = await pool.exec('generateThumbnailFile', [{ srcFilePath: source, outputFileDir: profile, outputFilePath: output }]);
      const jpeg = require(path.join(appRoot, 'node_modules/jpeg-js')).decode(fs.readFileSync(output));
      const bad = await pool.exec('generateThumbnailFile', [{ srcFilePath: path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), outputFileDir: profile, outputFilePath: output }]);
      return { good, bad, width: jpeg.width, height: jpeg.height,
        pixels: require('node:crypto').createHash('sha256').update(jpeg.data).digest('hex') };
    } finally { await pool.terminate(); }
  }, { root, profile });
  expect(result.good.status).toBe('success');
  expect(result.bad.status).toBe('failed-in-heic-convert');
  expect(Math.max(result.width, result.height)).toBe(400);
  expect(result.width).toBeGreaterThan(0);
  // Keep a pixel-level reference independently of the renderer screenshots.
  // Git's Windows CRLF conversion must not affect the strict decoded-pixel check.
  expect({ width: result.width, height: result.height, pixels: result.pixels }).toEqual(require('./snapshots/heic-thumbnail.json'));
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
