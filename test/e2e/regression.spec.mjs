import { test, expect, _electron } from 'playwright/test';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const visual = process.env.PLM_VISUAL === '1';
const photoFolder = path.join(root, 'test/test-resources/actual-photos');
let app, page, profile;
async function launch({ resize = true } = {}) {
  app = await _electron.launch({ executablePath: require('electron'), args: ['test/e2e/main.cjs'],
    cwd: root, env: { ...process.env, PLM_TEST_ROOT: profile }, timeout: 30000 });
  page = await app.firstWindow();
  if (resize) await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1200, 800));
  await page.waitForSelector('app-root app-home');
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
async function settings() {
  await page.evaluate(() => window.plmInternalRenderer.settingsDialog.showSettingsDialog());
  await expect(page.locator('app-settings-dialog')).toBeVisible();
}
test.beforeEach(async () => {
  if (test.info().config.updateSnapshots !== 'none') {
    expect(require('../../node_modules/@angular/core/package.json').version).toBe('18.2.4');
    expect(require('../../node_modules/electron/package.json').version).toBe('32.0.2');
  }
  profile = await mkdtemp(path.join(tmpdir(), 'plm-e2e-'));
  await launch();
});
test.afterEach(async () => {
  await app?.close();
  await rm(profile, { recursive: true, force: true });
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
  await expect(page.locator('.plm-leaflet-map-div-icon')).toHaveCount(2);
  await page.waitForFunction(() => !window.__plmMapMoving);
  const titles = await page.locator('.leaflet-pm-toolbar .button-container[title]').evaluateAll(nodes => nodes.map(n => n.title).sort());
  expect(titles).toEqual(['Set Region by Rectangle', 'Set Region by Vertex', 'Set Text', 'Edit Region', 'Drag Region', 'Remove Region'].sort());
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
  await shot('resized-home');
  await app.close();
  await launch();
  // The original app resets Split.js to 25/75 on restart; keep that behavior.
  const restarted = await page.locator('#home-left-sidebar').boundingBox();
  expect(Math.abs(restarted.width - before.width)).toBeLessThan(1);
});
test('window bounds survive restart and the Windows fullscreen menu stays visible', async () => {
  await dismissWelcome();
  if (process.platform === 'win32') {
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setFullScreen(true));
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(true);
    expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMenuBarVisible())).toBe(true);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setFullScreen(false));
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen())).toBe(false);
  }
  const saved = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    win.setBounds({ x: 100, y: 100, width: 1080, height: 720 });
    return win.getBounds();
  });
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
    const pool = require(path.join(root, 'node_modules/workerpool')).pool(
      path.join(root, 'src-main/thumbnail-generation/generate-thumbnail-file-worker.js'),
      { workerType: 'process', maxWorkers: 1 });
    const source = path.join(root, 'test/e2e/fixtures/demo.heic');
    const output = path.join(profile, 'thumbnail.jpg');
    try {
      const good = await pool.exec('generateThumbnailFile', [{ srcFilePath: source, outputFileDir: profile, outputFilePath: output }]);
      const jpeg = require(path.join(root, 'node_modules/jpeg-js')).decode(fs.readFileSync(output));
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
  expect(JSON.stringify({ width: result.width, height: result.height, pixels: result.pixels }, null, 2)).toMatchSnapshot('heic-thumbnail.json');
});
for (const [name, fixture] of [
  ['JPEG', 'actual-photos/Kobe/IMG_4676.JPG'],
  ['HEIC', '../../e2e/fixtures/demo.heic'],
]) {
  test(`embedded Photo Data Viewer loads a real local ${name} through the app`, async () => {
    await dismissWelcome();
    const photo = name === 'HEIC' ? path.join(root, 'test/e2e/fixtures/demo.heic') : path.join(root, 'test/test-resources', fixture);
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
