// Opens the application in every language and reports where the layout does not hold for a language's texts.
// See README.md in this folder. Build the application first (npm run build:dev or build:prod), then:
//
//   node test/layout/app-in-every-language.mjs [--languages=de,fi] [--pictures] [--output=<folder>]
//
// For each language, on an empty profile of a computer in that language, it goes through the screens that show
// texts: the Language dialog, the Welcome dialog, the home view without and with a folder of photos (in a window of
// 1200x800 and of 800x600), a photo's popup with its menu, the tree's menu, the Sort menu and its info dialog, the
// chart's menu, its message for a duration that it cannot show and its button for the photos within a zoom, a region
// on the map, the tabs of the Settings dialog with the choices of the clock's field, the question before a restart,
// the About box, the dialog of the thumbnails that failed, and the dialog of a folder without location data.
//
// In each screen it finds the texts that are cut, the texts that reach outside their dialog or the window, to a side
// or in height, the texts of buttons, tabs, menu items, labels and headings that are on more than one line, and the
// boxes that scroll. It prints what a language has and English does not have in the same screen, a text on more
// lines than the English one among it, and what English itself has, and writes everything to measurements.json in
// the output folder. With --pictures, it also writes a picture of each screen in each language,
// <screen>-<code>.png, which contact-sheets.mjs puts side by side.
//
// The windows are kept off the screen as in the e2e suite (test/e2e/README.md): hidden on macOS, transparent on
// Windows, and shown on Linux.
import { createRequire } from 'node:module';
import { cp, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const option = name => process.argv.slice(2).find(argument => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
const pictures = process.argv.includes('--pictures');
const only = option('languages')?.split(',');
const output = path.resolve(option('output') ?? path.join(tmpdir(), 'plm-layout-app'));
const require = createRequire(import.meta.url);
const { _electron } = require('playwright');
const locales = path.join(root, 'src-shared/i18n/locales');
// English first: what it has is what the other languages are compared with.
const codes = ['en', ...(await readdir(locales)).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5)).filter(code => code !== 'en').sort()]
  .filter(code => !only || code === 'en' || only.includes(code));
await mkdir(output, { recursive: true });

// The folders that the application opens: photos with location data and a HEIF file, whose thumbnail is made; two
// HEIF files that cannot be read, with a photo that has location data; and a photo without location data.
const folders = await mkdtemp(path.join(tmpdir(), 'plm-layout-folders-'));
const photos = path.join(folders, 'Photos');
await cp(path.join(root, 'test/test-resources/actual-photos'), photos, { recursive: true });
await copyFile(path.join(root, 'test/e2e/fixtures/demo.heic'), path.join(photos, 'demo.heic'));
const broken = path.join(folders, 'Broken');
await mkdir(broken);
for (const name of ['A broken.HEIC', 'B broken.HEIC'])
  await copyFile(path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), path.join(broken, name));
await copyFile(path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG'), path.join(broken, 'Kobe.JPG'));
const nowhere = path.join(folders, 'Nowhere');
await mkdir(nowhere);
await copyFile(path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), path.join(nowhere, 'Invalid Photo.JPG'));

/**
 * What is wrong with the texts within the elements of `selector`, in the page: those that an element around them
 * cuts, those that reach outside `within` (the dialog, the map; the window otherwise), those of a button, a tab, a
 * menu item, a label or a heading that are on more than one line, and the boxes that scroll.
 */
const measure = ([selector, within]) => {
  const found = { cut: [], outside: [], lines: [], scrolls: [] };
  const nameOf = element => `${element.tagName.toLowerCase()}${typeof element.className === 'string' && element.className.trim()
    ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const labels = 'button, [mat-menu-item], .mat-mdc-menu-item, mat-list-item, th, label, mat-label, mat-option, .mat-mdc-select-value,'
    + ' mat-checkbox, .setting-title, .dialog-header, .settings-dialog-header, .language-dialog-title, option, select,'
    + ' .photo-info-viewer-more-options-menu-item, .plm-leaflet-map-region-info-text, .date-unknown-photos-count';
  // What scrolls by design, whatever the language: the map, the lists of languages and of files, the tree.
  const scrollsByDesign = '.leaflet-container, cdk-virtual-scroll-viewport, .language-list, mat-tree, #home-sidebar-lower-pane';
  const boundsElement = within ? document.querySelector(within) : null;
  const bounds = boundsElement ? boundsElement.getBoundingClientRect()
    : { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight };
  const range = document.createRange();
  for (const root of document.querySelectorAll(selector)) {
    for (const box of [root, ...root.querySelectorAll('*')]) {
      if (box.closest(scrollsByDesign)) continue;
      const style = getComputedStyle(box);
      if (['auto', 'scroll'].includes(style.overflowX) && box.scrollWidth > box.clientWidth + 1)
        found.scrolls.push(`${nameOf(box)} sideways: ${box.scrollWidth - box.clientWidth}px`);
      if (['auto', 'scroll'].includes(style.overflowY) && box.scrollHeight > box.clientHeight + 1)
        found.scrolls.push(`${nameOf(box)} in height: ${box.scrollHeight - box.clientHeight}px`);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      const element = node.parentElement;
      if (!text || !element) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none' || element.closest('[hidden], .cdk-visually-hidden, .leaflet-tile-pane, canvas, mat-icon')) continue;
      range.selectNodeContents(node);
      const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
      if (rects.length === 0) continue;
      const left = Math.min(...rects.map(rect => rect.left));
      const right = Math.max(...rects.map(rect => rect.right));
      const top = Math.min(...rects.map(rect => rect.top));
      const bottom = Math.max(...rects.map(rect => rect.bottom));
      const shown = `${nameOf(element)} “${text.length > 50 ? text.slice(0, 50) + '…' : text}”`;
      // Cut by an element around it that hides or scrolls what does not fit. An inline element hides nothing.
      // The same elements say what is left to be seen of the text in height, for "outside": what is within each
      // of those that hide or scroll in height, wherever that element itself is.
      let seenTop = top;
      let seenBottom = bottom;
      let cut = false;
      for (let around = element; around && around !== document.body; around = around.parentElement) {
        const aroundStyle = getComputedStyle(around);
        if (aroundStyle.display === 'inline' || aroundStyle.display === 'contents') continue;
        const box = around.getBoundingClientRect();
        const inner = { left: box.left + parseFloat(aroundStyle.borderLeftWidth), right: box.right - parseFloat(aroundStyle.borderRightWidth),
          top: box.top + parseFloat(aroundStyle.borderTopWidth), bottom: box.bottom - parseFloat(aroundStyle.borderBottomWidth) };
        if (aroundStyle.overflowY !== 'visible') {
          seenTop = Math.max(seenTop, inner.top);
          seenBottom = Math.min(seenBottom, inner.bottom);
        }
        // What is shown in the top layer, as a menu or the choices of a field, is cut by nothing around it.
        if (around.matches(':popover-open') || aroundStyle.position === 'fixed') break;
        if (cut) continue;
        if (aroundStyle.overflowX !== 'visible' && (right > inner.right + 1 || left < inner.left - 1)) {
          found.cut.push(`${shown} by ${nameOf(around)} (${aroundStyle.overflowX}): ${Math.round(Math.max(right - inner.right, inner.left - left))}px`);
          cut = true;
        } else if (!['visible', 'auto', 'scroll'].includes(aroundStyle.overflowY) && (bottom > inner.bottom + 2 || top < inner.top - 2)) {
          found.cut.push(`${shown} by ${nameOf(around)} (${aroundStyle.overflowY}, in height): ${Math.round(Math.max(bottom - inner.bottom, inner.top - top))}px`);
          cut = true;
        }
      }
      if (right > Math.min(window.innerWidth, bounds.right) + 1 || left < Math.max(0, bounds.left) - 1)
        found.outside.push(`${shown}: ${Math.round(left)}..${Math.round(right)} of ${Math.round(bounds.left)}..${Math.round(bounds.right)}`);
      // Below or above the dialog or the window, as in a dialog that is taller than the window: what is left to be
      // seen of the text reaches there. A text that is outside to a side as well is reported for both.
      if (seenBottom > seenTop && (seenBottom > Math.min(window.innerHeight, bounds.bottom) + 2 || seenTop < Math.max(0, bounds.top) - 2))
        found.outside.push(`${shown} in height: ${Math.round(seenTop)}..${Math.round(seenBottom)} of ${Math.round(bounds.top)}..${Math.round(bounds.bottom)}`);
      const lines = new Set(rects.map(rect => Math.round(rect.top))).size;
      // The button that selects the photos within the chart's zoom is made for up to three lines (see its component).
      const linesByDesign = element.closest('app-select-photos-within-zoom') ? 3 : 1;
      if (lines > linesByDesign && element.closest(labels)) found.lines.push(`${shown}: ${lines} lines`);
    }
  }
  return found;
};

const results = {};
const failures = [];
for (const code of codes) {
  const profile = await mkdtemp(path.join(tmpdir(), 'plm-layout-profile-'));
  // The application takes PLM_TEST_SYSTEM_LANGUAGES as the operating system's languages in a test profile.
  const env = { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: process.platform === 'linux' ? '0' : '1',
    PLM_TEST_SYSTEM_LANGUAGES: `${code},en-US` };
  for (const key of ['PLM_EM_MAIN', 'PLM_EM_RENDERER', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS']) delete env[key];
  const app = await _electron.launch({ executablePath: require('electron'), args: ['test/e2e/main.mjs'], cwd: root, env, timeout: 30000 });
  results[code] = {};
  try {
    const page = await app.firstWindow();
    page.setDefaultTimeout(15000);
    const mainWindow = await app.browserWindow(page);
    const resize = async (width, height) => {
      await mainWindow.evaluate((window, [width, height]) => window.setContentSize(width, height), [width, height]);
      await page.waitForFunction(width => window.innerWidth === width, width);
    };
    await resize(1200, 800);
    await page.waitForSelector('app-root app-home');
    await page.waitForFunction(() => !!window.plmInternalRenderer?.settingsDialog?.showSettingsDialog);
    await page.waitForSelector('.leaflet-pm-toolbar');
    const shownIn = await page.evaluate(() => document.documentElement.lang);
    if (shownIn !== code) failures.push(`${code}: the application is in ${shownIn}`);
    const dialog = 'mat-dialog-container';
    const openFolder = async folder => {
      await app.evaluate(({ dialog }, folder) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] }); }, folder);
      await page.locator('.open-folder-button').click();
    };
    /**
     * Measures the texts within `selector`, which must stay within `within` (the dialog, for a dialog), and with
     * --pictures takes a picture of `target`, or of the window.
     */
    const screen = async (name, selector, target, within) => {
      await page.evaluate(() => document.fonts.ready);
      // The animation with which a dialog or a menu opens.
      await page.waitForTimeout(350);
      results[code][name] = await page.evaluate(measure, [selector, within ?? (selector === dialog ? dialog : null)]);
      if (!pictures) return;
      const file = path.join(output, `${name}-${code}.png`);
      if (target) await page.locator(target).first().screenshot({ path: file, scale: 'css' });
      else await page.screenshot({ path: file, scale: 'css' });
    };
    /** A step of its own: what fails in it is noted, whatever it left open is closed, and the next ones still run. */
    const step = async (name, run) => {
      try { await run(); } catch (problem) {
        failures.push(`${code} ${name}: ${String(problem.message).split('\n')[0]}`);
        for (let count = 0; count < 4 && await page.locator('.cdk-overlay-backdrop, mat-dialog-container').count(); count += 1) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    };
    const closeMenus = async () => {
      for (let count = 0; count < 4 && await page.locator('.mat-mdc-menu-panel').count(); count += 1) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
      }
    };

    await step('language-dialog', async () => {
      await page.waitForSelector('app-language-dialog');
      await screen('language-dialog', dialog, dialog);
      await page.locator('app-language-dialog .ok-button').click();
    });
    await step('welcome', async () => {
      await page.waitForSelector('app-welcome-dialog');
      await screen('welcome', dialog, dialog);
      await page.locator('app-welcome-dialog .ok-button').click();
      await page.waitForSelector('app-welcome-dialog', { state: 'detached' });
    });
    await step('home-empty', () => screen('home-empty', 'app-root'));
    await step('home-loaded', async () => {
      await openFolder(photos);
      // The loading dialog is there for a moment only: it is measured at once, if it is caught at all.
      const loading = await page.waitForSelector('app-loading-folder-dialog', { timeout: 5000 }).catch(() => null);
      if (loading) results[code].loading = await page.evaluate(measure, [dialog, dialog]).catch(() => undefined);
      await page.waitForFunction(() => document.querySelectorAll('.plm-leaflet-map-div-icon, .marker-cluster').length > 0);
      // The status bar of the thumbnails, once they are made, with its details opened.
      const statusBar = page.locator('app-thumbnail-generation-status-bar');
      await statusBar.locator('.close-button.fade-in-close-button').waitFor({ timeout: 40000 });
      await statusBar.locator('.progress-bar-with-details').click();
      await page.waitForTimeout(400);
      await screen('home-loaded', 'app-root');
      // A small window, in which the two status bars and the sidebar have little room.
      await resize(800, 600);
      await screen('home-small', 'app-thumbnail-generation-status-bar, app-loaded-files-status-bar, app-sidebar-upper-pane');
      await resize(1200, 800);
    });
    await step('popup-menu', async () => {
      await page.locator('.plm-leaflet-map-div-icon').first().dispatchEvent('click');
      await page.locator('.leaflet-popup .photo-info-viewer-more-options-button').click();
      await page.waitForSelector('.photo-info-viewer-more-options-menu');
      await screen('popup-menu', '.leaflet-popup', '#home-map', '#home-map');
      await page.keyboard.press('Escape');
      await page.locator('.leaflet-popup-close-button').click().catch(() => {});
    });
    await step('tree-menu', async () => {
      await page.locator('mat-tree-node').nth(1).click({ button: 'right' });
      await page.waitForSelector('.mat-mdc-menu-panel');
      await screen('tree-menu', '.mat-mdc-menu-panel', '#home-left-sidebar');
      await closeMenus();
    });
    await step('sort-menu', async () => {
      // The menu's one item opens the Sort menu, whose second item has the button of the info dialog.
      await page.locator('.more-options-button').click();
      await page.locator('.mat-mdc-menu-panel button[mat-menu-item]').first().click();
      await page.locator('.shooting-time-label-and-info-button').waitFor();
      await screen('sort-menu', '.mat-mdc-menu-panel');
      await page.locator('.shooting-time-label-and-info-button button').click();
      const info = page.locator('app-dir-tree-view-sort-shooting-time-info');
      await info.waitFor();
      await info.locator('.dialog-body button').click();
      await info.locator('.message-details').waitFor();
      await screen('sort-info', dialog, dialog);
      await info.locator('.close-button').click();
      await info.waitFor({ state: 'detached' });
      await closeMenus();
    });
    await step('chart', async () => {
      await page.locator('app-date-time-taken-chart-config .more-options-icon').click();
      await page.waitForSelector('.more-options-menu');
      await screen('chart-menu', '.more-options-menu, app-date-time-taken-chart-config', 'app-date-time-taken-chart');
      await closeMenus();
      // Photos taken years apart cannot be shown by the second: the chart says so.
      await page.locator('app-date-time-taken-chart-config select').selectOption('second');
      await page.waitForTimeout(600);
      await screen('chart-unsupported', 'app-date-time-taken-chart', 'app-date-time-taken-chart');
      await page.locator('app-date-time-taken-chart-config select').selectOption('day');
      await page.waitForTimeout(600);
      // A zoom, by the left handle of the chart's slider, which shows the button that selects the photos within it.
      const chart = await page.locator('app-date-time-taken-chart .chart').boundingBox();
      const handle = chart.y + chart.height - 23;
      await page.mouse.move(chart.x + 94, handle);
      await page.mouse.down();
      await page.mouse.move(chart.x + 90 + (chart.width - 180) * 0.6, handle, { steps: 12 });
      await page.mouse.up();
      await page.waitForSelector('app-select-photos-within-zoom button', { timeout: 5000 });
      await screen('chart-zoom', 'app-date-time-taken-chart .sidebar', 'app-date-time-taken-chart', 'app-date-time-taken-chart');
    });
    await step('region', async () => {
      const map = await page.locator('#plm-leaflet-map').boundingBox();
      await page.locator('.leaflet-pm-toolbar .leaflet-pm-icon-rectangle').first().click();
      await page.mouse.click(map.x + map.width * 0.3, map.y + map.height * 0.3);
      await page.mouse.move(map.x + map.width * 0.7, map.y + map.height * 0.7, { steps: 5 });
      await page.mouse.click(map.x + map.width * 0.7, map.y + map.height * 0.7);
      await page.waitForSelector('.plm-leaflet-map-region-info-text');
      await screen('region', '.plm-leaflet-map-region-info, .leaflet-control-container', '#home-map', '#home-map');
    });
    await step('settings', async () => {
      await page.evaluate(() => window.plmInternalRenderer.settingsDialog.showSettingsDialog());
      await page.waitForSelector('app-settings-dialog');
      const tabs = page.locator('app-settings-dialog mat-list-item');
      // The OS tab is there on Windows only.
      const names = ['language', 'appearance', 'datetime', ...(process.platform === 'win32' ? ['os'] : []), 'cache'];
      for (const [index, name] of names.entries()) {
        await tabs.nth(index).click();
        await screen(`settings-${name}`, dialog, dialog);
        if (name !== 'datetime') continue;
        // The choices of the clock's field, then one of them, after which the dialog says that it restarts.
        await page.locator('.clock-system-format-dropdown mat-select').click();
        await page.waitForSelector('mat-option');
        await screen('settings-clock-choices', '.mat-mdc-select-panel', null, dialog);
        await page.locator('mat-option').first().click();
        await page.waitForTimeout(300);
        await screen('settings-datetime-changed', dialog, dialog);
      }
      await page.locator('app-settings-dialog .settings-dialog-footer-buttons button').first().click();
      await page.waitForSelector('app-confirm-dialog');
      await screen('confirm-restart', 'app-confirm-dialog', 'mat-dialog-container:has(app-confirm-dialog)');
      await page.locator('app-confirm-dialog .cancel-button').click();
      await page.waitForSelector('app-confirm-dialog', { state: 'detached' });
      await page.locator('.settings-dialog-cancel-button').click();
      await page.waitForSelector('app-settings-dialog', { state: 'detached' });
    });
    await step('about', async () => {
      await page.evaluate(() => window.plmInternalRenderer.aboutBox.showAboutBox());
      await page.waitForSelector('app-about-box');
      await screen('about', dialog, dialog);
      await page.keyboard.press('Escape');
      await page.waitForSelector('app-about-box', { state: 'detached' });
    });
    await step('error-dialog', async () => {
      await openFolder(broken);
      const statusBar = page.locator('app-thumbnail-generation-status-bar');
      await statusBar.locator('.anchor-tag-like-text').waitFor({ state: 'attached', timeout: 40000 });
      const details = statusBar.locator('.progress-bar-with-details');
      if (!await details.evaluate(element => element.classList.contains('expanded-progress-bar-with-details'))) await details.click();
      await page.waitForTimeout(400);
      await screen('home-errors', 'app-thumbnail-generation-status-bar, app-loaded-files-status-bar', 'app-root');
      await statusBar.locator('.anchor-tag-like-text').click();
      await page.waitForSelector('app-thumbnail-generation-error-dialog tr[mat-row]');
      await screen('error-dialog', dialog, dialog);
      await page.locator('app-thumbnail-generation-error-dialog .close-button').first().click();
      await page.waitForSelector('app-thumbnail-generation-error-dialog', { state: 'detached' });
    });
    await step('no-location', async () => {
      await openFolder(nowhere);
      await page.waitForSelector('app-no-photos-with-location-data-dialog');
      await screen('no-location', dialog, dialog);
      await page.keyboard.press('Escape');
    });
  } catch (problem) {
    failures.push(`${code}: ${String(problem.message).split('\n')[0]}`);
  } finally {
    await app.close().catch(() => {});
    await rm(profile, { recursive: true, force: true });
  }
  process.stdout.write(`${code} `);
}
process.stdout.write('\n');
await rm(folders, { recursive: true, force: true });
await writeFile(path.join(output, 'measurements.json'), JSON.stringify(results, null, 1));

// What a language has and English does not have in the same screen: the same element with the same fault, whatever
// its text and its numbers are. The lines of a text are the exception: a text on more lines than the English one
// is reported, as "Open Folder" on two lines does not excuse a translation on four.
const kinds = ['cut', 'outside', 'lines', 'scrolls'];
const kindOf = item => item.replace(/“.*?”/g, '').replace(/\d+/g, 'N');
const linesOf = item => Number(item.match(/: (\d+) lines$/)?.[1] ?? 1);
let found = 0;
for (const [code, screens] of Object.entries(results)) {
  if (code === 'en') continue;
  for (const [name, at] of Object.entries(screens)) {
    for (const kind of kinds) {
      const inEnglish = new Map();
      for (const item of results.en?.[name]?.[kind] ?? []) inEnglish.set(kindOf(item), Math.max(inEnglish.get(kindOf(item)) ?? 1, linesOf(item)));
      for (const item of at?.[kind] ?? []) {
        if (inEnglish.has(kindOf(item)) && linesOf(item) <= inEnglish.get(kindOf(item))) continue;
        found += 1;
        console.log(`${code.padEnd(8)} ${name.padEnd(26)} ${kind.padEnd(8)} ${item}`);
      }
    }
  }
}
console.log(`${found} finding(s) that English does not have, in ${Object.keys(results).length} language(s).`);
console.log('English itself:');
for (const [name, at] of Object.entries(results.en ?? {}))
  for (const kind of kinds)
    for (const item of at?.[kind] ?? []) console.log(`  ${name.padEnd(26)} ${kind.padEnd(8)} ${item}`);
if (failures.length) console.log(`Steps that did not run to their end:\n  ${failures.join('\n  ')}`);
console.log(`Written to ${output}.`);
process.exitCode = failures.length ? 1 : 0;
