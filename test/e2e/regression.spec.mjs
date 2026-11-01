import { test, expect, _electron } from 'playwright/test';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const visual = process.env.PLM_VISUAL === '1';
const photoFolder = path.join(root, 'test/test-resources/actual-photos');
let app, page, profile;
async function launch() {
  app = await _electron.launch({ executablePath: require('electron'), args: ['test/e2e/main.cjs'],
    cwd: root, env: { ...process.env, PLM_TEST_ROOT: profile }, timeout: 30000 });
  page = await app.firstWindow();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1200, 800));
  await page.waitForSelector('app-root app-home');
  await page.waitForFunction(() => !!window.plmInternalRenderer?.settingsDialog?.showSettingsDialog);
}
async function shot(name, mask = []) {
  if (!visual) return;
  await page.evaluate(() => document.fonts.ready);
  if (process.env.PLM_NEGATIVE_CONTROL === '1' && name === 'empty-home') {
    await page.locator('.open-folder-button').evaluate(el => el.style.transform = 'translateX(20px)');
  }
  if (name === 'empty-home') {
    await expect(page.locator('app-sidebar-upper-pane')).toHaveScreenshot('toolbar.png', { animations: 'disabled' });
  }
  await expect(page).toHaveScreenshot(`${name}.png`, { mask });
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
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('files have location data.');
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
  await page.goto(new URL(`file://${path.join(root, 'docs/index.html')}`).href);
  await expect(page.locator('.title')).toHaveText('Photo Location Map');
  await expect(page.getByRole('link', { name: 'Download for Windows' })).toHaveAttribute('href', 'github-pages/downloading-for-windows/downloading-for-windows.html');
  await shot('website-desktop', [page.locator('iframe')]);
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(600, 800));
  await shot('website-narrow', [page.locator('iframe')]);
  await page.getByRole('link', { name: 'Download for Windows' }).click();
  await expect(page).toHaveURL(/downloading-for-windows\.html$/);
});
