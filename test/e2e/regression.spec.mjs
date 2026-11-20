import { test, expect, _electron } from 'playwright/test';
import { createRequire } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { browserSettingLabels, languages as websiteLanguages, matchLanguage } from '../../script/website/website-i18n.js';
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
// TL;DR: The lines of the main window's page about its Content Security Policy: what the policy refused, or a policy
// that Chromium could not read (src-main/file-server/content-security-policy.ts). A case fails with any that it did not
// cause on purpose (takePolicyViolations), so that the whole suite checks that the page needs nothing more.
// Details: Chromium writes them to the page's console, also for what happens before the page's scripts run, as of
// index.html. Photo Data Viewer's page and the website's are not the app's page, and have policies of their own, if any.
let policyViolations = [];
/** What takePolicyViolations was given in the case: the lines that the case causes on purpose. */
let expectedPolicyViolations = [];
/** Whether `url` is the main window's page: the app's page, or ng serve's for live reload. */
const isAppPageUrl = url => !!url && (url.startsWith('plm-app://app/') || (liveReload && url.startsWith('http://localhost:4200/')));
/**
 * Returns the lines about the Content Security Policy so far that `expected` matches, which the case causes on
 * purpose: those no longer fail it, nor does such a line that comes later. Any other line still does.
 */
const takePolicyViolations = expected => {
  expectedPolicyViolations.push(expected);
  return policyViolations.filter(line => expected(line));
};
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
/** The requests of the application's pages that have not finished, since its last launch. */
let unfinishedRequests = new Set();
const addressOf = request => request.url().slice(0, 160);
/** The page that made `request`, or undefined for a request that has none, such as a service worker's. */
function pageOf(request) {
  try {
    return request.frame().page();
  } catch {
    return undefined;
  }
}
/**
 * What each page other than the main window's wrote to its console, threw and did not load, from its start, which
 * describeViewerPage tells for a page of Photo Data Viewer.
 */
const otherPagesEvents = new WeakMap();
function recordForOtherPage(otherPage, line) {
  if (!otherPage || isAppPageUrl(otherPage.url())) return;
  if (!otherPagesEvents.has(otherPage)) otherPagesEvents.set(otherPage, []);
  otherPagesEvents.get(otherPage).push(line.slice(0, 300));
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
    if (/\bContent[- ]Security[- ]Policy\b/i.test(message.text()) && isAppPageUrl(message.page()?.url()))
      policyViolations.push(`${message.type()}: ${message.text()}`);
    recordForOtherPage(message.page(), `console ${message.type()}: ${message.text()}`);
  });
  const pageErrors = [];
  app.context().on('weberror', webError => {
    pageErrors.push(webError.error().message);
    if (webError.error().message.includes('NG0100')) changedWithoutNotification.push(webError.error().message);
    recordForOtherPage(webError.page(), `uncaught: ${webError.error().message}`);
  });
  // The requests that have not finished, and those that failed, for a launch whose home view does not render: the
  // page waits for the list of the map's base layers, which it downloads, before it starts Angular
  // (src/start-app.ts). Each request is kept by itself, as two can have one address, and counts as finished once its
  // answer is read to the end, which is what the page waits for.
  unfinishedRequests = new Set();
  const failedRequests = [];
  app.context().on('request', request => unfinishedRequests.add(request));
  app.context().on('requestfinished', request => unfinishedRequests.delete(request));
  app.context().on('requestfailed', request => {
    unfinishedRequests.delete(request);
    // The suite cancels the requests of analytics and of downloads itself (electron-util/e2e-test-hooks.js).
    const reason = request.failure()?.errorText ?? 'failed';
    if (reason === 'net::ERR_BLOCKED_BY_CLIENT') return;
    failedRequests.push(`${addressOf(request)}: ${reason}`);
    recordForOtherPage(pageOf(request), `request failed: ${addressOf(request)}: ${reason}`);
  });
  // A request that the server refuses, as one too many, finishes like any other.
  app.context().on('response', response => {
    if (response.status() < 400) return;
    failedRequests.push(`${addressOf(response.request())}: HTTP ${response.status()}`);
    recordForOtherPage(pageOf(response.request()), `HTTP ${response.status()}: ${addressOf(response.request())}`);
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
// The version in the Welcome and About dialogs, which changes with every release, is masked in their screenshots: the
// cases check its text before taking them.
const dialogVersion = () => page.locator('mat-dialog-container .app-version');
async function dismissWelcome() {
  if (await page.locator('app-welcome-dialog').count()) {
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.locator('app-welcome-dialog')).toHaveCount(0);
  }
}
/**
 * TL;DR: Waits until the menus that are open have appeared, as a person sees a menu before choosing from it.
 * Details: Angular Material's menu grows from 80% of its size as it opens, and takes no pointer events while it grows.
 * Before the growth starts, which came two frames and more after the menu in the test's hidden or transparent window,
 * the menu is transparent and at 80% of its size, but takes pointer events: Playwright took its items for stable, and
 * clicked Google in the middle of where it was at 80%. Once the menu had grown, that point was over Open Folder, the
 * item above, and Chromium moved the hover there, as it does when the page moves under a pointer that stays where it
 * is. The menu then closed the submenu of Google, as it does for a person who goes on to another item. On Windows CI,
 * the click on Open Google Maps came after that: Playwright found the submenu's pane in the way ("intercepts pointer
 * events") while the submenu faded out, and then the item gone. With a pause after the click on Google, the case
 * failed in the same way on macOS every time, and passed once the menus were waited for. A menu runs an animation
 * until it has appeared: for a moment after it is made, the exit animation of its last closing, then its growth. Its
 * class mat-menu-panel-animating, which takes no pointer events, goes once Angular renders it again.
 */
async function untilMenusShown() {
  await page.waitForFunction(() => [...document.querySelectorAll('.mat-mdc-menu-panel')]
    .every(panel => !panel.getAnimations().length && !panel.classList.contains('mat-menu-panel-animating')));
}
/**
 * Opens the menu of a photo's More Options button, and the submenus of the items named ('Selection'), each item clicked
 * once its menu has appeared. The menu is above the window, in the overlay container, rather than in the row or the
 * popup of its button.
 */
async function openMoreOptions(moreOptionsButton, ...submenus) {
  await moreOptionsButton.click();
  for (const name of submenus) {
    await untilMenusShown();
    await page.getByRole('menuitem', { name, exact: true }).click();
  }
  await untilMenusShown();
}
/**
 * Opens the menu of a photo's More Options button and chooses an item: the one named last, in the submenu of the item
 * named before it if there is one ('Selection', 'Select Only This').
 */
async function chooseFromMoreOptions(moreOptionsButton, ...names) {
  await openMoreOptions(moreOptionsButton, ...names.slice(0, -1));
  await page.getByRole('menuitem', { name: names.at(-1), exact: true }).click();
}
async function expectRepresentedPhotos(count) {
  // Cluster membership changes with available map space; the photo total must not.
  await expect.poll(async () => await page.locator('.plm-leaflet-map-div-icon').count() +
    await page.locator('.marker-cluster span').evaluateAll(nodes => nodes.reduce((sum, node) => sum + Number(node.textContent), 0))).toBe(count);
}
/**
 * Opens the Settings dialog, which opens on its Language tab, and shows the tab named `tab` if one is given. It returns
 * once Angular has rendered the dialog, with its list of languages.
 * TL;DR: A case types in the dialog only once it is rendered, as a person sees it before typing in it. A search typed
 * before makes the language list's first render list only what it finds, and the CDK's list box throws as it starts,
 * in a development build, when the chosen entry is not among them.
 * Details: The dialog's elements are made, and visible, when MatDialog.open() returns, and Angular renders them a
 * moment later, in the render that zoneless change detection schedules. "Select Previous and Select Next…" waited for
 * the dialog to be visible and typed "Norsk bokmål" in its search: before the first render in 3 of 20 recorded runs on
 * macOS. That render listed Norsk bokmål alone, without the chosen setting, the operating system's language, and
 * CdkListbox's ngAfterContentInit threw "Listbox has selected values that do not match any of its options.", which a
 * production build does not check. The render ended there, before the list box's own bindings, and Angular does not
 * call ngAfterContentInit again: the list box went without its keyboard, and threw at each later render. When the check
 * of each second (src/app/app.config.ts) came before the next render, it found the list box's id never rendered and
 * reported NG0100 with the previous value 'undefined', which failed the case in 2 of 19 runs. Typing in the same turn
 * of the page as the opening threw every time. The application is not changed: nobody can type in the dialog before it
 * is drawn, and the focus stays outside the dialog until then.
 */
async function settings(tab) {
  await page.evaluate(() => window.plmInternalRenderer.settingsDialog.showSettingsDialog());
  await expect(page.locator('app-settings-dialog').getByRole('option').first()).toBeVisible();
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
/**
 * Drags the files and folders at `itemPaths` over the map, as from Explorer or Finder, and drops them there, or with
 * `drop: false` takes them out of the window. Resolves with whether the page took the drag, the effect that it set
 * (copy for a drop that it takes, none for one that it refuses), and the text of the hint over the window meanwhile,
 * null when there was none. Dropped or taken out, the files leave no hint.
 * TL;DR: The Files of the drag have the items' paths on the disk, as a drag from the OS has, so that the preload reads
 * their paths as it does for a real drop (electron-util/preload/main-window.cjs).
 * Details: Playwright cannot start a drag of the OS. The Files come from a file input that this adds to the page, as
 * Chromium's DOM.setFileInputFiles makes them from paths, a folder's too: Playwright's setInputFiles takes a folder
 * only for an input with webkitdirectory, which then has the files in it rather than the folder. The drag's events
 * are dispatched with a DataTransfer that holds those Files. Chromium ignores the dropEffect that is set on a
 * DataTransfer which a script made, as it is not a drag's, so this one records what the page sets.
 */
async function dragOnWindow(itemPaths, { drop = true } = {}) {
  await page.evaluate(() => {
    const input = Object.assign(document.createElement('input'), { type: 'file', multiple: true, hidden: true, id: 'plm-e2e-dragged-files' });
    document.body.append(input);
  });
  const cdp = await page.context().newCDPSession(page);
  try {
    const { result } = await cdp.send('Runtime.evaluate', { expression: `document.getElementById('plm-e2e-dragged-files')` });
    await cdp.send('DOM.setFileInputFiles', { objectId: result.objectId, files: itemPaths });
  } finally {
    await cdp.detach();
  }
  const { taken, effect } = await page.evaluate(() => {
    const input = document.getElementById('plm-e2e-dragged-files');
    const dataTransfer = new DataTransfer();
    for (const file of input.files) dataTransfer.items.add(file);
    input.remove();
    let dropEffect = 'none';
    Object.defineProperty(dataTransfer, 'dropEffect', { get: () => dropEffect, set: effect => { dropEffect = effect; } });
    const map = document.getElementById('plm-leaflet-map');
    // false when the page prevented the event's default action, which takes the drag.
    const dispatch = type => !map.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
    window.__plmE2eDrag = dispatch;
    dispatch('dragenter');
    const taken = dispatch('dragover');
    return { taken, effect: dataTransfer.dropEffect };
  });
  // Angular shows the hint at the next frame at the latest.
  const hint = await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return document.querySelector('app-drop-hint')?.innerText.trim() ?? null;
  });
  await page.evaluate(drop => {
    const dispatch = window.__plmE2eDrag;
    delete window.__plmE2eDrag;
    dispatch(drop ? 'drop' : 'dragleave');
  }, drop);
  await expect(page.locator('app-drop-hint')).toHaveCount(0);
  return { taken, effect, hint };
}
/** Checks the question that a drop asks, about the folder or the file at `itemPath`, then clicks `answer`, OK or Cancel. */
async function answerDropQuestion(question, itemPath, answer) {
  const dialog = page.locator('app-confirm-dialog');
  await expect(dialog.locator('.message')).toHaveText(question);
  await expect(dialog.locator('.path')).toHaveText(itemPath);
  await dialog.getByRole('button', { name: answer, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
/**
 * What the dialog of an error that nothing handled in the main process shows, for a promise rejected there with
 * `message`. The dialog is replaced while it is shown, as the real one would wait for a click.
 */
async function mainProcessErrorDialog(message) {
  await app.evaluate(({ dialog }, message) => {
    globalThis.__plmE2eErrorDialogs = [];
    globalThis.__plmE2eShowMessageBoxSync ??= dialog.showMessageBoxSync;
    dialog.showMessageBoxSync = options => {
      globalThis.__plmE2eErrorDialogs.push(options);
      return 0;
    };
    Promise.reject(new Error(message));
  }, message);
  await expect.poll(() => app.evaluate(() => globalThis.__plmE2eErrorDialogs.length), { timeout: 20000 }).toBe(1);
  return app.evaluate(({ dialog }) => {
    dialog.showMessageBoxSync = globalThis.__plmE2eShowMessageBoxSync;
    return globalThis.__plmE2eErrorDialogs[0];
  });
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
  policyViolations = [];
  expectedPolicyViolations = [];
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
  expect(policyViolations.filter(line => !expectedPolicyViolations.some(expected => expected(line))),
    'The main window\'s page broke its Content Security Policy (src-main/file-server/content-security-policy.ts)').toEqual([]);
});
test('welcome, about and every available settings tab keep their appearance', async () => {
  await expect(page.locator('app-welcome-dialog')).toContainText(`Version ${manifest.version}`);
  const paths = await app.evaluate(({ app }) => [app.getPath('appData'), app.getPath('userData')]);
  expect(paths.every(p => p.startsWith(profile + path.sep))).toBe(true);
  await shot('welcome', [dialogVersion()]);
  await dismissWelcome();
  await shot('empty-home');
  await page.evaluate(() => window.plmInternalRenderer.aboutBox.showAboutBox());
  await expect(page.locator('app-about-box')).toBeVisible();
  await expect(page.locator('app-about-box .app-version')).toHaveText(`Version ${manifest.version}`);
  await shot('about', [dialogVersion()]);
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
  { label: 'Selection', items: ['Undo', 'Redo', 'Select Previous', 'Select Next'] },
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
  { label: '選択', items: ['元に戻す', 'やり直す', '前のファイルを選択', '次のファイルを選択'] },
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
  // The operating system's entry is in English, the operating system's language here, as each language is under its
  // own name, while the application is in Japanese.
  await settings();
  const languageSettings = page.locator('app-language-settings');
  await expect(languageSettings.getByRole('option')).toHaveText([systemLanguageInEnglish('English'), ...languageNames]);
  await expect(languageSettings.getByRole('option').first()).toHaveAttribute('lang', 'en');
  await expect(languageSettings.getByRole('option', { name: '日本語', exact: true })).toHaveAttribute('aria-selected', 'true');
  // The list opens where the chosen language is, far down the list.
  await expect(languageSettings.getByRole('option', { name: '日本語', exact: true })).toBeInViewport();
  // The search finds a language by its name in the application's language as well: ドイツ語 is German in Japanese.
  const languageSearch = languageSettings.getByRole('searchbox', { name: '検索' });
  await languageSearch.fill('ドイツ');
  await expect(languageSettings.getByRole('option')).toHaveText(['Deutsch']);
  await languageSearch.fill('見つからない言語');
  await expect(languageSettings.getByRole('status')).toHaveText('言語が見つかりません');
  // The operating system's entry is found by what it says in Japanese as well.
  await languageSearch.fill('の設定に従う');
  await expect(languageSettings.getByRole('option')).toHaveText([systemLanguageInEnglish('English')]);
  await languageSearch.fill('engl');
  await expect(languageSettings.getByRole('option')).toHaveText([systemLanguageInEnglish('English'), 'English']);
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
test('a new Language setting is sent to the analytics services', async () => {
  await launchAsNew();
  // English by its name, the language on screen: the setting changes from auto, without a restart.
  const dialog = page.locator('app-language-dialog');
  await dialog.getByRole('option', { name: 'English', exact: true }).click();
  await dialog.locator('.ok-button').click();
  await expect(dialog).toHaveCount(0);
  /** The analytics events with `action`: the service that got each, its category and its label, by service. */
  const events = action => app.evaluate((_electron, action) => globalThis.__plmAnalyticsEvents
    .filter(event => event.action === action)
    .map(({ service, category, label }) => ({ service, category, label: label ?? null }))
    .sort((a, b) => a.service.localeCompare(b.service)), action);
  /** One event for each analytics service. */
  const once = (category, label) => ['amplitude', 'mixpanel'].map(service => ({ service, category, label }));
  await expect.poll(() => events('Changed User Setting')).toEqual(once('User Setting', 'Language: en'));
  // The click of the button, which each service gets in a request of its own, so in no order with the other's.
  await expect.poll(() => events('[Language Dialog] Clicked OK button')).toEqual(once('Language Dialog', 'Language: en'));
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
  await shot('welcome-ja', [dialogVersion()]);
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
  // The menu, and the submenus that the pointer opens, with the items of the submenu open after the menu's.
  await openMoreOptions(popup.locator('.photo-info-viewer-more-options-button'));
  const moreOptionsItems = page.locator('.photo-info-viewer-more-options-menu-item');
  const menuInJapaneseOfPopup = ['選択', 'サイドバーで表示', 'フォルダーを開く', 'Google', 'データを表示'];
  await expect(moreOptionsItems).toHaveText(menuInJapaneseOfPopup);
  await page.getByRole('menuitem', { name: '選択', exact: true }).hover();
  await expect(moreOptionsItems).toHaveText([...menuInJapaneseOfPopup, 'このファイルのみを選択', '前のファイルを選択', '次のファイルを選択']);
  await page.getByRole('menuitem', { name: 'Google', exact: true }).hover();
  await expect(moreOptionsItems)
    .toHaveText([...menuInJapaneseOfPopup, 'Google マップを開く', 'Google Earth を開く', 'Google ストリートビューを開く']);
  // The menus are wider than in English, and this popup is at the map's left edge: they are above the window, which
  // they stay within, and neither the map nor the sidebar cuts them off. They are measured once they have grown.
  await untilMenusShown();
  const windowWidth = await page.evaluate(() => window.innerWidth);
  for (const menuBox of await page.locator('.photo-info-viewer-more-options-menu').evaluateAll(menus => menus.map(menu => menu.getBoundingClientRect().toJSON()))) {
    expect(menuBox.left).toBeGreaterThanOrEqual(0);
    expect(menuBox.right).toBeLessThanOrEqual(windowWidth);
  }
  // Escape closes the submenu, then the menu. A submenu takes the keys until it has faded out, as Angular Material's do.
  await page.keyboard.press('Escape');
  await expect(moreOptionsItems).toHaveText(menuInJapaneseOfPopup);
  await page.keyboard.press('Escape');
  await expect(page.locator('.photo-info-viewer-more-options-menu')).toHaveCount(0);
  // The tree's menu names what it is opened on, a folder or a file, where English says "Select Only This" of both.
  const treeMenuItems = page.getByRole('menuitem');
  const appleParkFolder = page.locator('mat-tree-node').filter({ hasText: 'Apple Park' });
  await appleParkFolder.click({ button: 'right' });
  await expect(treeMenuItems).toHaveText(['このフォルダーのみを選択', '開く', 'フォルダーを開く']);
  await page.keyboard.press('Escape');
  await expect(treeMenuItems).toHaveCount(0);
  await appleParkFolder.locator('button[mattreenodetoggle]').click();
  await page.locator('mat-tree-node').filter({ hasText: 'IMG_5769.JPG' }).click({ button: 'right' });
  await expect(treeMenuItems).toHaveText(['このファイルのみを選択', 'マップで表示', '開く', 'フォルダーを開く']);
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
  // The dialog of an error that nothing handled in the main process, whose details stay in English.
  const errorDialog = await mainProcessErrorDialog('Rejected on purpose by the e2e suite');
  expect(errorDialog).toMatchObject({ message: '予期しないエラーが発生しました。', buttons: ['OK', 'エラーをコピー'] });
  expect(errorDialog.detail).toMatch(/^Unhandled Promise Rejection\n/);
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
  // A photo without location data has a grey box in place of its checkbox, and its name starts as far from the row's
  // right edge as the name beside a checkbox does: the room between the box and the name is on the side towards which
  // the page's text runs, though the name, in Latin letters, runs the other way
  // (src/app/directory-tree-view/_non-selectable-node.scss).
  const treeRow = name => page.locator('mat-tree-node').filter({ has: page.locator('bdi').getByText(name, { exact: true }) });
  await treeRow('Unga').getByRole('button').click();
  const nameStart = name => treeRow(name).evaluate(row => {
    const text = document.createRange();
    text.selectNodeContents(row.querySelector('bdi'));
    return row.getBoundingClientRect().right - text.getBoundingClientRect().right;
  });
  await expect(treeRow('IMG_2581_WithoutGpsInfo.JPG').locator('.disabled-checkbox-alternative')).toBeVisible();
  expect(await nameStart('IMG_2581_WithoutGpsInfo.JPG')).toBeCloseTo(await nameStart('IMG_2581.JPG'), 0);
  // A date has the day of the week in Arabic, from moment's locale, and the digits 0 to 9.
  await page.locator('.plm-leaflet-map-div-icon').first().dispatchEvent('click');
  const popup = page.locator('.leaflet-popup');
  await expect(popup.locator('.leaflet-popup-content')).toHaveCSS('direction', 'rtl');
  await expect(popup.locator('.photo-info-viewer-date-time-taken')).toHaveText(/^\d{4}-\d{2}-\d{2} [\u0621-\u064A]+ \d{2}:\d{2}:\d{2}$/);
  // The photo's menu opens the other way round, from its button's left edge towards the right. Its submenu opens on
  // its left where the window has room, and on its right otherwise; the arrow towards the left opens it.
  const moreOptionsButton = popup.locator('.photo-info-viewer-more-options-button');
  await moreOptionsButton.click();
  const moreOptionsItems = page.locator('.photo-info-viewer-more-options-menu-item');
  const menuInArabic = ['التحديد', 'عرض في الشريط الجانبي', 'فتح المجلد', 'Google', 'عرض البيانات'];
  await expect(moreOptionsItems).toHaveText(menuInArabic);
  // Where the menus are once they have opened. The CDK places a menu when it renders it, after the menu's content, and
  // a menu grows from 80% of its size, from its corner at what opened it, as it opens: each is waited for in turn.
  const moreOptionsMenus = page.locator('.photo-info-viewer-more-options-menu');
  const grownBox = async menu => {
    const width = await menu.evaluate(element => element.offsetWidth);
    await expect.poll(async () => Math.round((await menu.boundingBox()).width)).toBe(width);
    return menu.boundingBox();
  };
  const buttonBox = await moreOptionsButton.boundingBox();
  await expect.poll(async () => Math.abs((await moreOptionsMenus.boundingBox()).x - buttonBox.x)).toBeLessThan(2);
  const menuBox = await grownBox(moreOptionsMenus);
  const selectionItem = page.getByRole('menuitem', { name: 'التحديد', exact: true });
  await selectionItem.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(moreOptionsItems).toHaveText([...menuInArabic, 'تحديد هذا الملف فقط', 'تحديد الملف السابق', 'تحديد الملف التالي']);
  await expect(page.getByRole('menuitem', { name: 'تحديد هذا الملف فقط', exact: true })).toBeFocused();
  // Beside its item, at the item's height.
  const selectionItemBox = await selectionItem.boundingBox();
  await expect.poll(async () => Math.abs((await moreOptionsMenus.nth(1).boundingBox()).y - selectionItemBox.y)).toBeLessThan(2);
  const submenuBox = await grownBox(moreOptionsMenus.nth(1));
  if (menuBox.x >= submenuBox.width)
    expect(submenuBox.x + submenuBox.width).toBeLessThanOrEqual(menuBox.x + 1);
  else
    expect(submenuBox.x).toBeGreaterThanOrEqual(menuBox.x + menuBox.width - 1);
  await page.keyboard.press('ArrowRight');
  await expect(moreOptionsItems).toHaveText(menuInArabic);
  await page.keyboard.press('Escape');
  await expect(moreOptionsMenus).toHaveCount(0);
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
    { label: 'التحديد', items: ['تراجع', 'إعادة', 'تحديد الملف السابق', 'تحديد الملف التالي'] },
    { label: 'الإعدادات', items: ['فتح الإعدادات'] },
    { label: 'مساعدة', items: [...(isMac ? [] : ['حول Photo Location Map']),
      'إظهار مربع حوار الترحيب', 'القائمة المتقدمة', 'فتح مجلد السجلات', 'إظهار/إخفاء أدوات المطوّرين'] },
  ]);
  // A folder without a photo with location data has the grey box too, and its name starts where the name of a folder
  // beside it starts, after its checkbox (src/app/directory-tree-view/_non-selectable-node.scss).
  const folders = path.join(profile, 'folders with and without location data');
  for (const [folder, photo] of [['with location data', 'Kobe/IMG_4676.JPG'], ['without location data', 'Unga/IMG_2581_WithoutGpsInfo.JPG']]) {
    await mkdir(path.join(folders, folder), { recursive: true });
    await copyFile(path.join(photoFolder, photo), path.join(folders, folder, path.basename(photo)));
  }
  await app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, folders);
  await page.getByRole('button', { name: 'فتح مجلد', exact: true }).click();
  await expect(treeRow('without location data').locator('.disabled-checkbox-alternative')).toBeVisible();
  expect(await nameStart('without location data')).toBeCloseTo(await nameStart('with location data'), 0);
});
test('on a computer whose language is Arabic, the application in English lists the operating system\'s entry in Arabic, from right to left', async () => {
  await launchAsNew({ env: { PLM_TEST_SYSTEM_LANGUAGES: 'ar-SA,en-US' } });
  // English, as a user chooses it in the Settings dialog: the application is in it from its next launch.
  await page.evaluate(() => Promise.all([window.plm.storage.write(['UserSettings', 'Language'], 'en'),
    window.plm.storage.write(['History', 'ClickedOkOnLanguageDialog'], 'true')]));
  await app.close();
  await launch({ env: { PLM_TEST_SYSTEM_LANGUAGES: 'ar-SA,en-US' } });
  await dismissWelcome();
  expect(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir])).toEqual(['en', 'ltr']);
  await settings();
  const languageSettings = page.locator('app-language-settings');
  const options = languageSettings.getByRole('option');
  // The entry is in Arabic, the operating system's language, as each language is under its own name. The name of the
  // language is a value of its text, between U+2068 and U+2069.
  const systemInArabic = `استخدام إعداد ${operatingSystemName ?? 'النظام'} (\u2068العربية\u2069)`;
  await expect(options).toHaveText([systemInArabic, ...languageNames]);
  const systemEntry = options.first();
  await expect(systemEntry).toHaveAttribute('lang', 'ar');
  await expect(languageSettings.getByRole('option', { name: 'English', exact: true })).toHaveAttribute('aria-selected', 'true');
  // It is written from right to left, and starts where the lines of the list start, at the left, as the entry of
  // Arabic does. The two are measured in one frame, as the dialog may still be growing while it opens.
  await expect(systemEntry.locator('bdi')).toHaveCSS('direction', 'rtl');
  const [systemLeft, arabicLeft] = await languageSettings.evaluate(settings => ['auto', 'ar']
    .map(setting => settings.querySelector(`[data-setting="${setting}"] bdi`).getBoundingClientRect().left));
  expect(systemLeft).toBeCloseTo(arabicLeft, 1);
  // The search finds it by what it says in English as well, and by its own words.
  const search = languageSettings.getByRole('searchbox', { name: 'Search' });
  await search.fill('setting');
  await expect(options).toHaveText([systemInArabic]);
  await search.fill('إعداد');
  await expect(options).toHaveText([systemInArabic]);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
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
  const choose = page.getByRole('button', { name: 'Select Photos in the Zoomed Range', exact: true });
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
  // The button keeps its width in English, on three lines: it is wider only for a language whose text would take more
  // than three lines (see its component). The lines that a text takes depend on the machine's font, as the
  // screenshots do.
  if (visual) expect(await choose.evaluate(button => [button.getBoundingClientRect().width, button.getBoundingClientRect().height])).toEqual([106, 70]);
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
  const choose = page.getByRole('button', { name: 'Select Photos in the Zoomed Range', exact: true });
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
test('a row of the tree makes its checkbox and its photo\'s thumbnail and buttons once it comes near the view, in the room that it had for them', async () => {
  // Every row of the photos of an expanded folder is in the page, but one far below the view has only its photo's
  // name and shooting time, with the room of the rest (src/app/directory-tree-view/dir-tree-view-checkbox-and-name/,
  // src/app/photo-info-viewer/), so that a large folder expands quickly, and loads no thumbnail that is far from the
  // view.
  const folder = path.join(profile, 'forty photos');
  await mkdir(folder);
  for (let index = 1; index <= 40; index++)
    await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, `IMG_${String(index).padStart(4, '0')}.JPG`));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('40 files have location data.');
  const rows = page.locator('mat-tree-node.leaf-tree-node');
  await expect(rows).toHaveCount(40);
  const loaded = row => row.locator('.photo-info-viewer-thumbnail').evaluate(image => image.complete && image.naturalWidth > 0);
  const [first, last] = [rows.first(), rows.last()];
  await expect.poll(() => loaded(first)).toBe(true);
  await expect(first.getByRole('checkbox')).toBeChecked();
  await expect(last.locator('bdi')).toHaveText('IMG_0040.JPG');
  await expect(last.locator('.photo-info-viewer-date-time-taken')).toHaveText('2017-12-16 Sat 20:11:22');
  await expect(last.getByRole('checkbox')).toHaveCount(0);
  await expect(last.locator('.photo-info-viewer-thumbnail')).toHaveCount(0);
  await expect(last.locator('.photo-info-viewer-lower-div button')).toHaveCount(0);
  // No thumbnail far below the sidebar's view is loaded: a row makes its thumbnail, and Chromium loads a lazy image,
  // from 1,250 pixels away.
  const loadedFarBelow = await page.locator('#home-sidebar-lower-pane').evaluate(pane => {
    const farBelow = pane.getBoundingClientRect().bottom + 2000;
    return [...pane.querySelectorAll('mat-tree-node .photo-info-viewer-thumbnail')]
      .filter(image => image.getBoundingClientRect().top > farBelow && image.complete && image.naturalWidth > 0).length;
  });
  expect(loadedFarBelow).toBe(0);
  /** The row's height, where its name is and how wide, and how big its photo's viewer is: what it makes keeps them. */
  const layout = row => row.evaluate(element => {
    const box = element.getBoundingClientRect();
    const name = element.querySelector('bdi').getBoundingClientRect();
    const viewer = element.querySelector('app-photo-info-viewer').getBoundingClientRect();
    return { height: box.height, nameStart: name.left - box.left, nameWidth: name.width, viewerHeight: viewer.height,
      viewerWidth: viewer.width };
  });
  const before = await layout(last);
  expect(before).toEqual(await layout(first));
  // Scrolled into view, the last row makes its checkbox, thumbnail and buttons, in the room that it had for them.
  await last.scrollIntoViewIfNeeded();
  await expect.poll(() => loaded(last)).toBe(true);
  await expect(last.getByRole('checkbox')).toBeChecked();
  await expect(last.locator('.photo-info-viewer-lower-div button')).toHaveCount(3);
  expect(await layout(last)).toEqual(before);
  await expect(rows).toHaveCount(40);
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
  await chooseFromMoreOptions(popup.locator('.photo-info-viewer-more-options-button'), 'Selection', 'Select Only This');
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
test('Reveal in Sidebar from a popup of the map expands the folders above the photo, scrolls its row smoothly to the middle of the sidebar and highlights it there, without changing the selection', async () => {
  // The photo is three folders down, after twenty folders of a photo without a location and before three such photos,
  // so that its row is far below what the sidebar shows, with enough rows after it to be scrolled to the middle.
  const folder = path.join(profile, 'many folders');
  const withoutLocation = path.join(photoFolder, 'Unga/IMG_2581_WithoutGpsInfo.JPG');
  for (let index = 1; index <= 20; index++) {
    const subfolder = path.join(folder, `folder ${String(index).padStart(2, '0')}`);
    await mkdir(subfolder, { recursive: true });
    await copyFile(withoutLocation, path.join(subfolder, 'no location.JPG'));
  }
  const folderOfPhoto = path.join(folder, 'the photo', 'taken', 'in Kobe');
  await mkdir(folderOfPhoto, { recursive: true });
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folderOfPhoto, 'IMG_4676.JPG'));
  for (const name of ['a.JPG', 'b.JPG', 'c.JPG']) await copyFile(withoutLocation, path.join(folder, name));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('1 files have location data.');
  const treeNode = name => page.locator('mat-tree-node').filter({ has: page.getByText(name, { exact: true }) });
  const row = treeNode('IMG_4676.JPG');
  await expect(row).toHaveCount(0);
  await expect(treeNode('the photo')).toHaveAttribute('aria-expanded', 'false');
  const pane = page.locator('#home-sidebar-lower-pane');
  expect(await pane.evaluate(element => element.scrollTop)).toBe(0);

  // The popup of the folder's only photo on the map, which opens by itself.
  const popup = page.locator('.leaflet-popup');
  await expect(popup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
  await openMoreOptions(popup.getByRole('button', { name: 'More Options' }));
  // From before the click on, the sidebar's scroll position at each frame, and whether a row is highlighted then.
  await pane.evaluate(element => {
    const frames = globalThis.revealFrames = [];
    const record = () => {
      frames.push({ top: element.scrollTop, highlighted: element.querySelector('[data-reveal-highlight]') !== null });
      if (frames.filter(frame => frame.highlighted).length < 5 && frames.length < 600)
        requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  await page.getByRole('menuitem', { name: 'Reveal in Sidebar', exact: true }).click();
  for (const name of ['the photo', 'taken', 'in Kobe']) await expect(treeNode(name)).toHaveAttribute('aria-expanded', 'true');
  await expect(row).toHaveAttribute('data-reveal-highlight', 'lit');
  await expect(row).toHaveCSS('background-color', 'rgba(255, 193, 7, 0.35)');
  await expect(row).toHaveCSS('transition-timing-function', 'ease-in-out');
  expect(await pane.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  // The sidebar scrolls to the row over several frames, never back, and slows down to a stop: its last step is shorter
  // than half its longest, which skips the middle of the way when the row is far (EasedScroll). The highlight starts
  // once it has stopped. How it speeds up and slows down, frame by frame, is in EasedScroll's own tests.
  await page.waitForFunction(() => globalThis.revealFrames.filter(frame => frame.highlighted).length >= 5);
  const frames = await page.evaluate(() => globalThis.revealFrames);
  const highlightedAt = frames.findIndex(frame => frame.highlighted);
  const steps = frames.slice(1, highlightedAt + 1).map((frame, index) => frame.top - frames[index].top);
  const moving = steps.filter(step => step !== 0);
  const report = `Scroll steps until the highlight: ${steps.join(', ')}`;
  expect(moving.length, report).toBeGreaterThanOrEqual(5);
  expect(moving.every(step => step > 0), report).toBe(true);
  expect(moving.at(-1), report).toBeLessThan(Math.max(...moving) / 2);
  expect(frames.slice(highlightedAt).every(frame => frame.top === frames[highlightedAt].top), report).toBe(true);
  // In the middle of what the sidebar shows: above its horizontal scrollbar, which Windows and Linux draw below the
  // rows, so that the middle of the sidebar's box is half the scrollbar lower there. macOS draws it over the rows.
  const distanceFromMiddle = await row.evaluate(rowElement => {
    const sidebar = rowElement.closest('#home-sidebar-lower-pane');
    const shownMiddle = sidebar.getBoundingClientRect().top + sidebar.clientTop + sidebar.clientHeight / 2;
    const rowBox = rowElement.getBoundingClientRect();
    return Math.abs(rowBox.top + rowBox.height / 2 - shownMiddle);
  });
  expect(distanceFromMiddle).toBeLessThan(2);
  // The highlight fades, and the row is as before. The selection, and so the map, are as they were.
  await expect(row).toHaveAttribute('data-reveal-highlight', 'fading');
  await expect(row).not.toHaveAttribute('data-reveal-highlight', /./, { timeout: 5000 });
  await expect(row).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(treeCheckbox('IMG_4676.JPG')).toBeChecked();
  await expect(popup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
});
test('Reveal in Sidebar reaches a row far down the sidebar, though the rows above what the sidebar shows grow on the way', async () => {
  // Twenty photos before the photo, in a folder that is collapsed, so that its row is farther than two heights of the
  // sidebar below what the sidebar shows once the folder is expanded, and five after it, so that the row can come to
  // the middle.
  const folder = path.join(profile, 'photos far down');
  const photos = path.join(folder, 'photos');
  await mkdir(photos, { recursive: true });
  const withoutLocation = path.join(photoFolder, 'Unga/IMG_2581_WithoutGpsInfo.JPG');
  for (let index = 1; index <= 20; index++)
    await copyFile(withoutLocation, path.join(photos, `${String(index).padStart(2, '0')}.JPG`));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(photos, 'IMG_4676.JPG'));
  for (let index = 1; index <= 5; index++)
    await copyFile(withoutLocation, path.join(photos, `x ${index}.JPG`));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('1 files have location data.');
  const treeNode = name => page.locator('mat-tree-node').filter({ has: page.getByText(name, { exact: true }) });
  await expect(treeNode('photos')).toHaveAttribute('aria-expanded', 'false');
  const popup = page.locator('.leaflet-popup');
  await expect(popup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
  await openMoreOptions(popup.getByRole('button', { name: 'More Options' }));
  // Once the sidebar has skipped the middle of the way (EasedScroll), the rows above what it shows grow by 4 pixels
  // each, as the rows of photos whose thumbnails fill the height of their room, those of HEIC photos taken upright, do
  // when the tree makes them there. Chromium moves the sidebar as much to keep what it shows in place (scroll
  // anchoring), which is not the user's own scroll.
  await page.locator('#home-sidebar-lower-pane').evaluate(sidebar => {
    let lastTop = sidebar.scrollTop;
    const growRowsAboveOnceSkipped = () => {
      if (sidebar.scrollTop - lastTop <= sidebar.clientHeight) {
        lastTop = sidebar.scrollTop;
        requestAnimationFrame(growRowsAboveOnceSkipped);
        return;
      }
      const shownTop = sidebar.getBoundingClientRect().top + sidebar.clientTop;
      const rowsAbove = [...sidebar.querySelectorAll('mat-tree-node')].filter(row => {
        const { bottom } = row.getBoundingClientRect();
        return bottom <= shownTop && bottom > shownTop - 1000;
      });
      for (const row of rowsAbove) row.style.paddingBottom = '4px';
      globalThis.grownRows = rowsAbove.length;
    };
    requestAnimationFrame(growRowsAboveOnceSkipped);
  });
  await page.getByRole('menuitem', { name: 'Reveal in Sidebar', exact: true }).click();
  const row = treeNode('IMG_4676.JPG');
  await expect(row).toHaveAttribute('data-reveal-highlight', 'lit');
  expect(await page.evaluate(() => globalThis.grownRows)).toBeGreaterThan(0);
  // In the middle of what the sidebar shows, as in the case above.
  const distanceFromMiddle = await row.evaluate(rowElement => {
    const sidebar = rowElement.closest('#home-sidebar-lower-pane');
    const shownMiddle = sidebar.getBoundingClientRect().top + sidebar.clientTop + sidebar.clientHeight / 2;
    const rowBox = rowElement.getBoundingClientRect();
    return Math.abs(rowBox.top + rowBox.height / 2 - shownMiddle);
  });
  expect(distanceFromMiddle).toBeLessThan(2);
});
test('Reveal in Map from a row of the tree opens the photo\'s popup, selecting the photo too when it is not, and ending the chart\'s zoom when that leaves the photo out', async () => {
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  const treeNode = name => page.locator('mat-tree-node').filter({ has: page.getByText(name, { exact: true }) });
  await treeNode('Kobe').getByRole('button').click();
  const row = treeNode('IMG_4676.JPG');
  const popup = page.locator('.leaflet-popup');
  const revealFromMoreOptions = () => chooseFromMoreOptions(row.getByRole('button', { name: 'More Options' }), 'Reveal in Map');

  // A photo on the map: its popup opens, and its marker looks chosen, as when the marker is clicked. Both are in the
  // middle of the map.
  await revealFromMoreOptions();
  await expect(popup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
  const marker = page.locator('.plm-leaflet-map-div-icon').filter({ hasText: '2017-12-16' });
  await expect(marker.locator('.plm-leaflet-map-div-icon-content-container')).toHaveCSS('background-color', 'rgba(63, 81, 181, 0.15)');
  const mapBox = await page.locator('#home-map').boundingBox();
  const popupBox = await popup.boundingBox();
  const markerBox = await marker.boundingBox();
  expect(Math.abs((popupBox.y + markerBox.y + markerBox.height) / 2 - (mapBox.y + mapBox.height / 2))).toBeLessThan(40);
  expect(popupBox.x).toBeGreaterThanOrEqual(mapBox.x);
  expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(mapBox.x + mapBox.width);

  // A photo that is not selected, from the tree's context menu: it is selected too, which Undo takes back.
  await treeCheckbox('IMG_4676.JPG').uncheck();
  await expect(popup).toHaveCount(0);
  await expectRepresentedPhotos(3);
  await row.click({ button: 'right' });
  await expect(page.getByRole('menuitem')).toHaveText(['Select Only This', 'Reveal in Map', 'Open', 'Open Folder']);
  await page.getByRole('menuitem', { name: 'Reveal in Map' }).click();
  await expect(treeCheckbox('IMG_4676.JPG')).toBeChecked();
  for (const name of ['Apple Park', 'Gold Coast', 'Unga']) await expect(treeCheckbox(name)).toBeChecked();
  await expect(popup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
  await app.evaluate(({ Menu }) => Menu.getApplicationMenu().getMenuItemById('photo-selection-undo').click());
  await expect(treeCheckbox('IMG_4676.JPG')).not.toBeChecked();
  await expectRepresentedPhotos(3);

  // A selected photo that the chart's zoom leaves out: the zoom ends, as with the chart's Reset Zoom button. As in the
  // chart's case, the slider's left handle is dragged to the last year, which has only the photo of Apple Park.
  await treeCheckbox('IMG_4676.JPG').check();
  await expectRepresentedPhotos(4);
  await page.locator('app-date-time-taken-chart-config select').selectOption('Year');
  const chart = page.locator('app-date-time-taken-chart .chart');
  const chartBox = await chart.boundingBox();
  const y = chartBox.y + chartBox.height - 23;
  await page.mouse.move(chartBox.x + 94, y);
  await page.mouse.down();
  await page.mouse.move(chartBox.x + 90 + (chartBox.width - 180) * 0.92, y, { steps: 12 });
  await page.mouse.up();
  const choose = page.getByRole('button', { name: 'Select Photos in the Zoomed Range', exact: true });
  await expect(choose).toBeVisible();
  await expectRepresentedPhotos(1);
  await revealFromMoreOptions();
  await expect(choose).toBeHidden();
  await expect(popup.locator('.photo-info-viewer-name')).toHaveText('IMG_4676.JPG');
  for (const name of ['Apple Park', 'Gold Coast', 'Kobe', 'Unga']) await expect(treeCheckbox(name)).toBeChecked();
});
test('Reveal in Map opens the popup of a cluster of photos taken at one place with the photo\'s tile chosen, and Reveal in Sidebar there shows that photo\'s row', async () => {
  const folder = path.join(profile, 'photos taken at one place');
  await mkdir(folder);
  for (const name of ['Kobe 1.JPG', 'Kobe 2.JPG']) await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, name));
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('2 files have location data.');
  await expect(page.locator('.marker-cluster')).toHaveCount(1);
  const rowOf = name => page.locator('mat-tree-node').filter({ hasText: name });
  const shownName = page.locator('.photo-cluster-viewer-right-pane .photo-info-viewer-name');
  // Taken at the same time, the two photos can have their tiles in either order: each is chosen in turn.
  for (const name of ['Kobe 2.JPG', 'Kobe 1.JPG']) {
    await chooseFromMoreOptions(rowOf(name).getByRole('button', { name: 'More Options' }), 'Reveal in Map');
    await expect(shownName).toHaveText(name);
    await expect(page.locator('.photo-cluster-viewer-tile.selected-tile')).toHaveCount(1);
  }
  const shownPhoto = page.locator('.photo-cluster-viewer-right-pane');
  await chooseFromMoreOptions(shownPhoto.getByRole('button', { name: 'More Options' }), 'Reveal in Sidebar');
  await expect(rowOf('Kobe 1.JPG')).toHaveAttribute('data-reveal-highlight', /^(lit|fading)$/);
  await expect(rowOf('Kobe 2.JPG')).not.toHaveAttribute('data-reveal-highlight', /./);
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
  await openMoreOptions(inTree.getByRole('button', { name: 'More Options' }));
  await expect(page.locator('.photo-info-viewer-more-options-menu-item')).toHaveText(['Selection', 'Reveal in Map', 'Open Folder', 'Google', 'View Data']);
  // While the menu is open, which is above the window rather than in the row, the row keeps its buttons: the pointer is
  // on the menu, off the row, for longer than the buttons take to fade (0.2 s).
  await menuItem('View Data').hover();
  await page.waitForTimeout(400);
  await expect(inTree.locator('.photo-info-viewer-lower-div')).toHaveCSS('opacity', '1');
  // A click on an item does what the item says, and closes the menu.
  await menuItem('Open Folder').click();
  await expect(menu).toHaveCount(0);
  await expect.poll(openCommands).toEqual([
    osOpenCommand(photo), osOpenCommand(movie), osOpenCommand(photo), osOpenCommand(photo, { containingFolder: true }),
  ]);
  // The menu closes when its button is clicked again, and when something else is clicked, which the click goes on to:
  // the button beside it opens the photo.
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(1);
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(0);
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(1);
  await page.locator('app-loaded-files-status-bar').click();
  await expect(menu).toHaveCount(0);
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(1);
  await inTree.getByRole('button', { name: 'Open File' }).click();
  await expect(menu).toHaveCount(0);
  await expect.poll(openCommands).toEqual([
    osOpenCommand(photo), osOpenCommand(movie), osOpenCommand(photo), osOpenCommand(photo, { containingFolder: true }), osOpenCommand(photo),
  ]);
  // The wheel elsewhere closes it too, as the tree would scroll under it: on the folder's row, above the menu.
  await inTree.getByRole('button', { name: 'More Options' }).click();
  await expect(menu).toHaveCount(1);
  await page.locator('mat-tree-node').first().hover();
  await page.mouse.wheel(0, 40);
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
  for (const name of ['Open Google Maps', 'Open Google Earth', 'Open Google Street View'])
    await chooseFromMoreOptions(inPopup.getByRole('button', { name: 'More Options' }), 'Google', name);
  await expect.poll(openedUrls).toEqual([
    expect.stringMatching(/^https:\/\/maps\.google\.com\/\?q=[\d.]+,[\d.]+&ll=[\d.]+,[\d.]+&z=14$/),
    expect.stringMatching(/^https:\/\/earth\.google\.com\/web\/search\/[\d.]+,[\d.]+$/),
    expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/@\?api=1&map_action=pano&parameters&viewpoint=[\d.]+,[\d.]+$/),
  ]);
  // All three at the photo's place, which none of the analytics' events has: they get the site alone.
  const place = new URL((await openedUrls())[0]).searchParams.get('q');
  expect(await openedUrls()).toEqual([
    `https://maps.google.com/?q=${place}&ll=${place}&z=14`,
    `https://earth.google.com/web/search/${place}`,
    `https://www.google.com/maps/@?api=1&map_action=pano&parameters&viewpoint=${place}`,
  ]);
  const openedUrlEvents = service => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents
    .filter(event => event.service === service && event.action === 'Opened URL')
    .map(event => event.value)
    .sort(), service);
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => openedUrlEvents(service), { timeout: 20000 }).toEqual([
      'https://earth.google.com/web/search/ with latitude and longitude',
      'https://maps.google.com/ with query parameters for latitude, longitude, and zoom',
      'https://www.google.com/maps/ with query parameters for latitude, longitude',
    ]);
  }
  const analyticsEvents = JSON.stringify(await app.evaluate(() => globalThis.__plmAnalyticsEvents));
  for (const coordinate of place.split(','))
    expect(analyticsEvents).not.toContain(coordinate);
  // The keyboard: Enter opens the menu on its first item, the arrows go through the items and into a submenu and back,
  // Enter opens a submenu too, and Escape closes the submenu, then the menu, which gives its button the focus back.
  // A screen reader is told that the button and the submenus' items open menus, and whether they are open.
  const moreOptionsInPopup = inPopup.getByRole('button', { name: 'More Options' });
  await expect(moreOptionsInPopup).toHaveAttribute('aria-haspopup', 'menu');
  await moreOptionsInPopup.focus();
  await page.keyboard.press('Enter');
  await expect(moreOptionsInPopup).toHaveAttribute('aria-expanded', 'true');
  const focusedMenuItem = () => page.evaluate(() => document.activeElement.closest('[role="menuitem"]')?.textContent.trim());
  await expect.poll(focusedMenuItem).toBe('Selection');
  await expect(page.getByRole('menuitem', { name: 'Selection', exact: true })).toHaveAttribute('aria-haspopup', 'menu');
  await page.keyboard.press('ArrowRight');
  await expect.poll(focusedMenuItem).toBe('Select Only This');
  await expect(page.getByRole('menuitem', { name: 'Selection', exact: true })).toHaveAttribute('aria-expanded', 'true');
  // A submenu takes the keys until it has faded out, as Angular Material's do: the next key once it has.
  await page.keyboard.press('ArrowLeft');
  await expect.poll(focusedMenuItem).toBe('Selection');
  await expect(menu).toHaveCount(1);
  for (const name of ['Reveal in Sidebar', 'Open Folder', 'Google']) {
    await page.keyboard.press('ArrowDown');
    await expect.poll(focusedMenuItem).toBe(name);
  }
  await page.keyboard.press('Enter');
  await expect.poll(focusedMenuItem).toBe('Open Google Maps');
  await page.keyboard.press('Escape');
  await expect.poll(focusedMenuItem).toBe('Google');
  await expect(menu).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(moreOptionsInPopup).toBeFocused();
  await expect(moreOptionsInPopup).toHaveAttribute('aria-expanded', 'false');
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
test('Select Previous and Select Next go through the photos in the order they were taken, from a photo\'s menu and from the Selection menu', async () => {
  // The photos were taken at Gold Coast in 2013, Unga in 2015, Kobe in 2017 and Apple Park in 2019: not in the order
  // of their folders' names. The Selection menu's items act on the one selected photo and reach the renderer through
  // IPC, as Undo and Redo do.
  const menuItem = id => ({
    click: () => app.evaluate(({ Menu }, id) => Menu.getApplicationMenu().getMenuItemById(id).click(), id),
    enabled: () => app.evaluate(({ Menu }, id) => Menu.getApplicationMenu().getMenuItemById(id).enabled, id),
  });
  const selectPrevious = menuItem('photo-selection-select-previous');
  const selectNext = menuItem('photo-selection-select-next');
  const enabled = async () => ({ previous: await selectPrevious.enabled(), next: await selectNext.enabled() });
  expect(await app.evaluate(({ Menu }) => ['photo-selection-select-previous', 'photo-selection-select-next']
    .map(id => Menu.getApplicationMenu().getMenuItemById(id).accelerator))).toEqual(['CmdOrCtrl+Left', 'CmdOrCtrl+Right']);
  const folders = { 'IMG_1579.JPG': 'Gold Coast', 'IMG_2581.JPG': 'Unga', 'IMG_4676.JPG': 'Kobe', 'IMG_5769.JPG': 'Apple Park' };
  const popup = page.locator('.leaflet-popup');
  /** The photo is the only one selected: checked alone in the tree, and alone on the map, whose popup opens for it. */
  async function expectSelected(name) {
    await expectRepresentedPhotos(1);
    await expect(popup.locator('.photo-info-viewer-name')).toHaveText(name);
    for (const [photo, folder] of Object.entries(folders))
      await expect(treeCheckbox(folder)).toBeChecked({ checked: photo === name });
  }
  /**
   * The photo's row is shown in the sidebar, as Reveal in Sidebar shows it: its folder expanded, the row in view and
   * highlighted for a moment, which it is once the sidebar has scrolled there.
   */
  async function expectShownInSidebar(name) {
    await expect(page.locator('mat-tree-node').filter({ has: page.getByText(folders[name], { exact: true }) })).toHaveAttribute('aria-expanded', 'true');
    const row = page.locator('mat-tree-node.leaf-tree-node').filter({ hasText: name });
    await expect(row).toHaveAttribute('data-reveal-highlight', /./);
    await expect(row).toBeInViewport({ ratio: 1 });
  }
  await dismissWelcome();
  await openFolderWithPicker(photoFolder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('4 files have location data.');
  await expectRepresentedPhotos(4);
  await expect.poll(enabled).toEqual({ previous: false, next: false });
  await page.evaluate(photo => window.plmInternalRenderer.photoSelection.selectOnlyThis(photo), path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'));
  await expectSelected('IMG_1579.JPG');
  await expect.poll(enabled).toEqual({ previous: false, next: true });

  // The Selection menu, from the first photo to the last, and back. Each step shows the photo in the sidebar.
  for (const name of ['IMG_2581.JPG', 'IMG_4676.JPG', 'IMG_5769.JPG']) {
    await selectNext.click();
    await expectSelected(name);
    await expectShownInSidebar(name);
  }
  await expect.poll(enabled).toEqual({ previous: true, next: false });
  // Nothing comes after the last photo, nor round to the first: clicked anyway, the item leaves the selection.
  await selectNext.click();
  for (const name of ['IMG_4676.JPG', 'IMG_2581.JPG', 'IMG_1579.JPG']) {
    await selectPrevious.click();
    await expectSelected(name);
    await expectShownInSidebar(name);
  }
  await expect.poll(enabled).toEqual({ previous: false, next: true });
  // Each step is in the selection's history.
  await menuItem('photo-selection-undo').click();
  await expectSelected('IMG_2581.JPG');
  await expect.poll(enabled).toEqual({ previous: true, next: true });

  // A photo's menu, right after Select Only This: in the popup of the map, and in the photo's row of the tree. Its
  // submenu Selection has Select Previous and Select Next, of which one that has no photo to select cannot be chosen.
  const moreOptionsItems = page.locator('.photo-info-viewer-more-options-menu-item');
  const selection = ['Select Only This', 'Select Previous', 'Select Next'];
  const menuItemNamed = name => page.getByRole('menuitem', { name, exact: true });
  await openMoreOptions(popup.locator('.photo-info-viewer-more-options-button'), 'Selection');
  await expect(moreOptionsItems).toHaveText(['Selection', 'Reveal in Sidebar', 'Open Folder', 'Google', 'View Data', ...selection]);
  for (const name of selection) await expect(menuItemNamed(name)).toBeEnabled();
  await menuItemNamed('Select Next').click();
  await expectSelected('IMG_4676.JPG');
  await expectShownInSidebar('IMG_4676.JPG');
  const kobe = page.locator('mat-tree-node').filter({ has: page.getByText('Kobe', { exact: true }) });
  const row = page.locator('mat-tree-node').filter({ hasText: 'IMG_4676.JPG' });
  await row.locator('.photo-info-viewer-thumbnail').hover();
  await openMoreOptions(row.getByRole('button', { name: 'More Options' }), 'Selection');
  await expect(moreOptionsItems).toHaveText(['Selection', 'Reveal in Map', 'Open Folder', 'Google', 'View Data', ...selection]);
  await menuItemNamed('Select Next').click();
  await expectSelected('IMG_5769.JPG');
  await openMoreOptions(popup.locator('.photo-info-viewer-more-options-button'), 'Selection');
  await expect(menuItemNamed('Select Next')).toBeDisabled();
  await menuItemNamed('Select Previous').click();
  await expectSelected('IMG_4676.JPG');
  await expect.poll(enabled).toEqual({ previous: true, next: true });

  // The items' keys: Cmd on macOS and Ctrl on Windows and Linux, with the Left and Right arrow keys. Electron gives
  // the menu only a key that the page leaves unhandled, which the page does where nothing else uses them, a node of
  // the tree and the map too, while a text field moves its caret with them.
  await page.evaluate(() => {
    window.__plmKeys = [];
    // On the window, which a key reaches after the listeners of the tree and the map. Not Ctrl or Cmd itself.
    window.addEventListener('keydown', event => {
      if (event.key.startsWith('Arrow')) window.__plmKeys.push({ key: event.key, handled: event.defaultPrevented });
    });
  });
  await expect(kobe).toHaveAttribute('aria-expanded', 'true');
  for (const focused of [kobe, page.locator('#plm-leaflet-map')]) {
    await focused.focus();
    for (const key of ['ControlOrMeta+ArrowLeft', 'ControlOrMeta+ArrowRight']) await page.keyboard.press(key);
  }
  // The tree's own arrows would have collapsed the folder and gone into it, and taken the keys.
  await expect(kobe).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => window.__plmKeys))
    .toEqual(['ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'].map(key => ({ key, handled: false })));
  await settings();
  const search = page.locator('app-settings-dialog input[type="search"]');
  await search.fill('Norsk bokmål');
  await page.keyboard.press('ControlOrMeta+ArrowLeft');
  // To the start of the line on macOS, and of the word on Windows and Linux.
  expect(await search.evaluate(input => input.selectionStart)).toBe(isMac ? 0 : 'Norsk '.length);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('app-settings-dialog')).toHaveCount(0);
  await expectSelected('IMG_4676.JPG');

  // The keys through the menu, where it takes them in this run. Playwright's keys never reach it, as the browser
  // skips a key of CDP that the page leaves unless it has a native key code (Chromium's input_handler.cc): these
  // have one, with what macOS gives a key of the menu, the arrow's character, and AppKit's commands for it. On macOS,
  // the application menu takes the keys of any window of the application. On Windows and Linux, a window takes an
  // accelerator only while it is active (views::View::CanHandleAccelerators), which a headless run on Windows never
  // makes it (electron-util/e2e-test-hooks.js), so the page's part above is what is checked there.
  if (isMac || await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().some(window => window.isFocused()))) {
    const cdp = await page.context().newCDPSession(page);
    const nativeArrows = {
      ArrowLeft: { keyCode: 37, macKeyCode: 123, character: '\uF702', macCommand: 'moveToLeftEndOfLine' },
      ArrowRight: { keyCode: 39, macKeyCode: 124, character: '\uF703', macCommand: 'moveToRightEndOfLine' },
    };
    const pressWithCmdOrCtrl = async key => {
      const { keyCode, macKeyCode, character, macCommand } = nativeArrows[key];
      const event = { modifiers: isMac ? 4 : 2, key, code: key, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: isMac ? macKeyCode : keyCode };
      await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...event,
        ...(isMac ? { text: character, unmodifiedText: character, commands: [macCommand] } : {}) });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
    };
    await page.evaluate(() => document.activeElement.blur());
    await pressWithCmdOrCtrl('ArrowLeft');
    await expectSelected('IMG_2581.JPG');
    // Again and again, through the trip: the first photo has none before it.
    await pressWithCmdOrCtrl('ArrowLeft');
    await expectSelected('IMG_1579.JPG');
    await expect.poll(enabled).toEqual({ previous: false, next: true });
    await pressWithCmdOrCtrl('ArrowLeft');
    await pressWithCmdOrCtrl('ArrowRight');
    await expectSelected('IMG_2581.JPG');
    await kobe.focus();
    await pressWithCmdOrCtrl('ArrowRight');
    await expectSelected('IMG_4676.JPG');
    await pressWithCmdOrCtrl('ArrowLeft');
    await expectSelected('IMG_2581.JPG');
    await expect(kobe).toHaveAttribute('aria-expanded', 'true');
    await expect(kobe).toBeFocused();
    await page.locator('#plm-leaflet-map').focus();
    await pressWithCmdOrCtrl('ArrowRight');
    await expectSelected('IMG_4676.JPG');
    await settings();
    await search.fill('Norsk bokmål');
    await pressWithCmdOrCtrl('ArrowLeft');
    expect(await search.evaluate(input => [input.value, input.selectionStart])).toEqual(['Norsk bokmål', isMac ? 0 : 'Norsk '.length]);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator('app-settings-dialog')).toHaveCount(0);
    // The key went to the text field only: one step back from where the selection was.
    await selectPrevious.click();
    await expectSelected('IMG_2581.JPG');
  }
  // The tree keeps the arrows alone.
  await kobe.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(kobe).toHaveAttribute('aria-expanded', 'false');
});
test('Select Previous and Select Next scroll the sidebar to the selected photo\'s row only when the sidebar does not show all of it', async () => {
  // Copies of one photo, all taken at the same time, so that their names order them: twelve in a folder, which go
  // further down than the sidebar shows, and three in the next folder.
  const folder = path.join(profile, 'two days');
  const pathOf = number => path.join(folder, number <= 12 ? 'day 1' : 'day 2', `photo ${String(number).padStart(2, '0')}.JPG`);
  for (let number = 1; number <= 15; number++) {
    await mkdir(path.dirname(pathOf(number)), { recursive: true });
    await copyFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'), pathOf(number));
  }
  await dismissWelcome();
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('15 files have location data.');
  const step = id => app.evaluate(({ Menu }, id) => Menu.getApplicationMenu().getMenuItemById(id).click(), id);
  const selectOnly = number => page.evaluate(photo => window.plmInternalRenderer.photoSelection.selectOnlyThis(photo), pathOf(number));
  const folderRow = name => page.locator('mat-tree-node').filter({ has: page.getByText(name, { exact: true }) });
  const row = number => page.locator('mat-tree-node.leaf-tree-node').filter({ hasText: path.basename(pathOf(number)) });
  const scrollTop = () => page.locator('#home-sidebar-lower-pane').evaluate(pane => pane.scrollTop);
  await expect(folderRow('day 1')).toHaveAttribute('aria-expanded', 'false');

  // A step into a folder expands it, and shows the row.
  await selectOnly(1);
  await expectRepresentedPhotos(1);
  await step('photo-selection-select-next');
  await expect(row(2)).toHaveAttribute('data-reveal-highlight', /./);
  await expect(folderRow('day 1')).toHaveAttribute('aria-expanded', 'true');
  await expect(row(2)).toBeInViewport({ ratio: 1 });

  // A step to a row that the sidebar shows all of leaves the sidebar where it is, although the row is far from the
  // middle of the sidebar, where Reveal in Sidebar would have scrolled it: here at the top of what the sidebar shows,
  // whatever the sidebar's height is, which is less on Windows CI's screen.
  await selectOnly(3);
  await expectRepresentedPhotos(1);
  const { shownTop, fromMiddle } = await row(4).evaluate(element => {
    const pane = element.closest('#home-sidebar-lower-pane');
    const paneTop = () => pane.getBoundingClientRect().top + pane.clientTop;
    pane.scrollTop += element.getBoundingClientRect().top - paneTop() - 1;
    const box = element.getBoundingClientRect();
    return { shownTop: pane.scrollTop, fromMiddle: paneTop() + pane.clientHeight / 2 - (box.top + box.height / 2) };
  });
  await expect(row(4)).toBeInViewport({ ratio: 1 });
  expect(fromMiddle).toBeGreaterThan(20);
  await step('photo-selection-select-next');
  await expect(row(4)).toHaveAttribute('data-reveal-highlight', /./);
  expect(await scrollTop()).toBe(shownTop);

  // A step to a row below what the sidebar shows scrolls there, and the row lights up once the sidebar has stopped.
  await selectOnly(12);
  await expectRepresentedPhotos(1);
  await expect(folderRow('day 2')).not.toBeInViewport();
  await step('photo-selection-select-next');
  await expect(row(13)).toHaveAttribute('data-reveal-highlight', /./);
  await expect(folderRow('day 2')).toHaveAttribute('aria-expanded', 'true');
  await expect(row(13)).toBeInViewport({ ratio: 1 });
  expect(await scrollTop()).toBeGreaterThan(0);
  await expect(treeCheckbox('photo 13.JPG')).toBeChecked();
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
  /**
   * The names of the tree's nodes as they are shown, from the top: the folder, its subfolders, then its photos. Each
   * name is in a bdi element, whether or not its row has made its checkbox.
   */
  const treeNames = () => page.locator('mat-tree-node')
    .evaluateAll(nodes => nodes.map(node => node.querySelector('bdi')?.textContent.trim()));
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
  await expectChecked(['By Name', 'Ascending'], ['By Date Taken', 'Descending']);
  await chooseInSortMenu('Descending');
  await expect.poll(treeNames).toEqual([root, 'y', 'x', ...[...byName].reverse()]);
  await chooseInSortMenu('By Date Taken');
  await expect.poll(treeNames).toEqual([root, 'y', 'x', ...[...byShootingTime].reverse()]);
  await expectChecked(['By Date Taken', 'Descending'], ['By Name', 'Ascending']);
  // The info button beside "By Date Taken" explains it, with details that open and close.
  await page.locator('.more-options-button').click();
  await sortMenuItem('Sort').click();
  await sortMenuItem('By Date Taken').locator('button').click();
  const info = page.locator('app-dir-tree-view-sort-shooting-time-info');
  await expect(info).toContainText('Sort By Date Taken');
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
  await expectChecked(['By Date Taken', 'Descending'], ['By Name', 'Ascending']);
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
test('a folder dropped on the window opens once the user confirms, with all of its photos selected', async () => {
  const folder = path.join(profile, 'dropped 写真 # 100%');
  await mkdir(folder);
  await copyFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'), path.join(folder, 'Gold Coast.JPG'));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  // While a dialog is open, Open Folder cannot be clicked, and a drop is refused, with no hint.
  await expect(page.locator('app-welcome-dialog')).toBeVisible();
  expect(await dragOnWindow([folder], { drop: false })).toEqual({ taken: true, effect: 'none', hint: null });
  await dismissWelcome();
  // A File that the page makes is not on the disk: it opens nothing, and nothing is asked.
  await page.evaluate(() => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(['not a photo'], 'made by the page.jpg'));
    document.getElementById('plm-leaflet-map').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  });
  await expect.poll(() => app.evaluate(() => globalThis.__plmAnalyticsEvents
    .filter(event => event.action === 'Drop to Open: Nothing to Open').map(event => event.label)))
    .toEqual(['Item Type: none', 'Item Type: none']);
  await expect(page.locator('app-confirm-dialog')).toHaveCount(0);
  // The hint shows while the folder is over the window, and goes once the folder is taken out of it.
  expect(await dragOnWindow([folder], { drop: false })).toEqual({ taken: true, effect: 'copy', hint: 'Drop to open the folder.' });
  await expect(page.locator('app-confirm-dialog')).toHaveCount(0);
  // Canceled, the folder is not opened, and the page may not read it.
  expect(await dragOnWindow([folder])).toEqual({ taken: true, effect: 'copy', hint: 'Drop to open the folder.' });
  await answerDropQuestion('Do you want to open the folder below?', folder, 'Cancel');
  await expect(page.evaluate(folder => window.plm.directoryTree.create(folder), folder)).rejects.toThrow('Only a folder that the user chose can be read.');
  await expect(page.locator('mat-tree-node')).toHaveCount(0);
  await dragOnWindow([folder]);
  await answerDropQuestion('Do you want to open the folder below?', folder, 'OK');
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('2 files have location data.');
  await expect(page.locator('mat-tree-node').filter({ hasText: path.basename(folder) })).toBeVisible();
  await expect(treeCheckbox('Kobe.JPG')).toBeChecked();
  await expect(treeCheckbox('Gold Coast.JPG')).toBeChecked();
  await expectRepresentedPhotos(2);
});
test('a photo dropped on the window opens its folder once the user confirms, with only that photo selected', async () => {
  const folder = path.join(profile, 'dropped through a photo');
  await mkdir(folder);
  await copyFile(path.join(photoFolder, 'Gold Coast/IMG_1579.JPG'), path.join(folder, 'Gold Coast.JPG'));
  await copyFile(path.join(photoFolder, 'Kobe/IMG_4676.JPG'), path.join(folder, 'Kobe.JPG'));
  await dismissWelcome();
  const photo = path.join(folder, 'Kobe.JPG');
  // Of two photos dropped at once, the first is asked about. The hint is that of a folder, which a file opens too.
  expect(await dragOnWindow([photo, path.join(folder, 'Gold Coast.JPG')]))
    .toEqual({ taken: true, effect: 'copy', hint: 'Drop to open the folder.' });
  await answerDropQuestion('Do you want to open the file below?', photo, 'OK');
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('2 files have location data.');
  await expect(treeCheckbox('Kobe.JPG')).toBeChecked();
  await expect(treeCheckbox('Gold Coast.JPG')).not.toBeChecked();
  await expectRepresentedPhotos(1);
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
  // Neither the page nor a worker of it has Node.js: the page cannot even start a worker, which its Content Security
  // Policy refuses (src-main/file-server/content-security-policy.ts), and the preference above would give one none.
  // The bridge is frozen and has no generic way to the main process.
  const inPage = await page.evaluate(async () => ({
    globals: ['require', 'process', 'module', 'Buffer', 'global', 'setImmediate'].map(name => [name, typeof window[name]]),
    worker: await new Promise(resolve => {
      const worker = new Worker(URL.createObjectURL(new Blob(['postMessage([typeof require, typeof process])'])));
      worker.onmessage = message => { resolve(message.data); worker.terminate(); };
      worker.onerror = () => resolve('refused');
    }),
    frozen: Object.isFrozen(window.plm) && Object.isFrozen(window.plm.shell) && Object.isFrozen(window.plm.startup),
    members: Object.values(window.plm).flatMap(member => typeof member === 'object' && member ? Object.keys(member) : []),
  }));
  expect(inPage.globals).toEqual(['require', 'process', 'module', 'Buffer', 'global', 'setImmediate'].map(name => [name, 'undefined']));
  expect(inPage.worker).toBe('refused');
  expect(takePolicyViolations(line => /\bworker\b.*'blob:/i.test(line))).toHaveLength(1);
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
test('the main window\'s page refuses what its Content Security Policy does not allow, and each refusal is logged and recorded', async () => {
  await dismissWelcome();
  // What a text that the page shows could try, were it injected into the page
  // (src-main/file-server/content-security-policy.ts). The addresses are of this computer, where nothing answers, so
  // that the case sends nothing out should the policy allow one.
  const outcome = await page.evaluate(async () => {
    const script = document.createElement('script');
    script.textContent = 'window.__plmInjectedScriptRan = true;';
    document.body.append(script);
    // From a task of the page's: Playwright's own evaluation may evaluate a string under any policy.
    const evaluated = await new Promise(resolve => setTimeout(() => {
      try { resolve(String(eval('"ran"'))); } catch (error) { resolve(error.name); }
    }));
    const fetched = await fetch('https://127.0.0.1:9/').then(() => 'sent', error => error.name);
    const image = await new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve('loaded');
      image.onerror = () => resolve('refused');
      image.src = 'http://127.0.0.1:9/tile.png';
    });
    return { script: window.__plmInjectedScriptRan ? 'ran' : 'refused', evaluated, fetched, image };
  });
  expect(outcome).toEqual({ script: 'refused', evaluated: 'EvalError', fetched: 'TypeError', image: 'refused' });
  // The suite sees each refusal in the page's console, as it would one that a case does not cause on purpose.
  const refusals = [/\binline script\b/i, /\beval\b/i, /'https:\/\/127\.0\.0\.1:9\/'/, /'http:\/\/127\.0\.0\.1:9\/tile\.png'/];
  await expect.poll(() => refusals.filter(refusal => !policyViolations.some(line => refusal.test(line))).map(String)).toEqual([]);
  // Those lines, and the fetch's second one, which gives the address without quotes.
  takePolicyViolations(line => refusals.some(refusal => refusal.test(line)) || line.includes('https://127.0.0.1:9/'));
  // The main process writes each to the log (src-main/record-console-errors.ts), which the page could not do for one
  // before its scripts ran...
  const logFile = await app.evaluate(({ app }) => {
    const require = globalThis.__plmTestRequire;
    const configPath = require('node:path').join(app.getAppPath(), 'out/app/src-shared/log/file-config/log-file-config.js');
    return require(configPath).LogFileConfig.filePath;
  });
  await expect.poll(async () => {
    const lines = (await readFile(logFile, 'utf8')).split(/\r?\n/).filter(line => line.includes('[Content Security Policy] The main window\'s page: '));
    return refusals.filter(refusal => !lines.some(line => refusal.test(line))).map(String);
  }).toEqual([]);
  // ...and records it as an error of the page's console, with the origin of an address and not its path.
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents
      .filter(event => event.service === service && event.action === 'Console Error (Renderer)' && /Content Security Policy/.test(event.label))
      .map(event => event.label), service), { timeout: 20000 })
      .toEqual(expect.arrayContaining([expect.stringContaining("'http://127.0.0.1:9/<path>'")]));
  }
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
test('an unhandled promise rejection in the main process is recorded, and shown with its details', async () => {
  await dismissWelcome();
  const message = 'Rejected in the main process on purpose by the e2e suite';
  const shown = await mainProcessErrorDialog(message);
  expect(shown).toMatchObject({ type: 'error', message: 'An unexpected error occurred.', buttons: ['OK', 'Copy Error'] });
  // The details stay in English: the kind of error, then its stack.
  expect(shown.detail.split('\n').slice(0, 2)).toEqual(['Unhandled Promise Rejection', `Error: ${message}`]);
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents
      .filter(event => event.service === service && event.action === 'Unhandled Error (Main)')
      .map(event => ({ category: event.category, label: event.label })), service), { timeout: 20000 })
      .toEqual([{ category: 'Unhandled Error', label: `Error: ${message}` }]);
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
    // The worker in a utility process of its own, as the app starts it for each thumbnail.
    const { generateThumbnailInProcess } = require(path.join(appRoot, 'out/app/src-main/thumbnail-generation/thumbnail-generation.js'));
    const source = path.join(root, 'test/e2e/fixtures/demo.heic');
    const output = path.join(profile, 'thumbnail.jpg');
    const good = await generateThumbnailInProcess({ srcFilePath: source, outputFileDir: profile, outputFilePath: output });
    const jpeg = require(path.join(appRoot, 'node_modules/jpeg-js')).decode(fs.readFileSync(output));
    const bad = await generateThumbnailInProcess({ srcFilePath: path.join(root, 'test/test-resources/unsupported-files/Invalid Photo.JPG'), outputFileDir: profile, outputFilePath: output });
    return { good, bad, decoderVersions, width: jpeg.width, height: jpeg.height,
      pixels: require('node:crypto').createHash('sha256').update(jpeg.data).digest('hex') };
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
  // The close button is at the end of the bar, and the room that the bar's parts leave over is before the summary.
  // The visual run's window leaves some: there, the progress bar is as long as it gets, so that it keeps its length
  // and its place whatever the summary beside it says.
  const layout = await statusBar.evaluate(bar => {
    const end = bar.getBoundingClientRect().right - parseFloat(getComputedStyle(bar).paddingRight);
    const box = selector => bar.querySelector(selector).getBoundingClientRect();
    return { roomAfterCloseButton: Math.round(end - box('.close-button').right),
      progressWidth: Math.round(box('.progress-bar-with-details').width) };
  });
  expect(layout.roomAfterCloseButton).toBe(0);
  if (visual) expect(layout.progressWidth).toBe(800);
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
  // In a narrow window, the details take more lines, and their area is as tall as they are: none of them is under
  // the status bar of the loaded files, as the ones past a height of 150px were.
  await (await app.browserWindow(page)).evaluate(window => window.setContentSize(400, 800));
  await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(400);
  await expect.poll(() => details.evaluate(area => Math.round(area.querySelector('.details').getBoundingClientRect().bottom
    - area.getBoundingClientRect().bottom))).toBeLessThanOrEqual(0);
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
/**
 * What the page of Photo Data Viewer's window `viewer` shows and could not load, and what it wrote to its console and
 * threw, for a case whose viewer did not show what the case waited for (expectShownInViewer).
 */
async function describeViewerPage(viewer) {
  const shown = await within5Seconds(viewer.evaluate(() => JSON.stringify({
    address: location.href, readyState: document.readyState, title: document.title,
    text: (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 300),
    images: [...document.images].map(image => `${image.alt || 'no alt'}: ${image.naturalWidth}x${image.naturalHeight}`),
    notLoaded: performance.getEntriesByType('resource').filter(entry => entry.responseStatus >= 400)
      .map(entry => `${entry.name}: HTTP ${entry.responseStatus}`),
  })).catch(error => `could not be read: ${error.message}`), 'no answer within 5 seconds');
  const notFinished = [...unfinishedRequests].filter(request => pageOf(request) === viewer).map(addressOf);
  const events = otherPagesEvents.get(viewer) ?? [];
  return [`The page: ${shown}`, `Its requests not finished: ${JSON.stringify(notFinished)}`,
    `What it wrote to its console, threw and did not load: ${events.length > 30 ? `the last 30 of ${events.length}` : 'all'}`,
    ...events.slice(-30), await describeApplication().catch(error => `The application could not be read: ${error.message}`)]
    .join('\n');
}
/**
 * Waits until `shown`, a locator in the page of Photo Data Viewer's window `viewer`, is visible, and loads the page
 * again while the viewer's server answers it without some files of the viewer's own build, and the page does not load
 * itself again.
 * TL;DR: Such a page was loaded while the viewer's production deployment changed. It has the HTML of one deployment,
 * and got its scripts from the other one, which does not have them, so it never starts and shows nothing. The viewer
 * now loads such a page again by itself; the helper does so only where the viewer did not.
 * Details:
 * - The suite loads the viewer from its production server, https://pdv-in-plm.vercel.app/
 *   (src-main/photo-data-viewer/photo-data-viewer-server-config.ts). Each merge to Photo Data Viewer's main deploys
 *   it anew, apart from this app: 13 times on 2026-11-18, 9 on 2026-11-19. The server has the files of its current
 *   deployment only, as their addresses name no deployment (Vercel's Skew Protection would add ?dpl= to them), and
 *   each deployment's build names some of its files anew: Next.js names a script by its content, the _app script
 *   holds the commit that it was built from, and the build manifests are in a folder named after the build. The
 *   page's HTML has no content of its own (3.4 kB, an empty root): without its scripts, the page never asks its window
 *   for the photo.
 * - The change takes seconds. Watched on 2026-11-20, as Photo Data Viewer's 46342a9 became the deployment (its status
 *   said so at 12:31:25 UTC): from 12:31:26.3 to 12:31:34.1, the server gave the HTML of either deployment, and each
 *   script from either, so that 10 of the 44 page loads made then got their HTML with its _app or main script
 *   answered 404. The old HTML still came 6.9 seconds after the new one first had.
 * - Seen twice in CI on Ubuntu, a case that found no img in 30 seconds, while the cases before and after it passed:
 *   - In the push run of main on a12b956b (run 44535489119), the case of a JPEG with Unicode, spaces, # and % in its
 *     path, against the development build. The status of Photo Data Viewer's 931cfb4 said its deployment was ready
 *     at 14:02:14 UTC on 2026-11-19, and the case opened the viewer at about 14:02:15.
 *   - In the pull_request run of #760 on de127696 (run 44734642049), the case of a HEIC, against the AppImage. It
 *     opened the viewer at about 12:31:28 UTC on 2026-11-20, in the seconds watched above.
 * - The deployments of 26faec8 and 931cfb4 each answer 404 for the other's webpack, main and _app scripts and build
 *   manifests. Reproduced with the server on a later deployment, cf4b714's: given the HTML of 26faec8's, the page got
 *   404 for those files and others, and showed nothing for 15 seconds; loaded again, it showed the photo 0.4 seconds
 *   later.
 * - Since Photo Data Viewer's 1b42c3c (its pull request #104, src/page-load/reload-for-missing-build-files.ts), the
 *   page loads itself again half a second after its load event, at most 3 times a minute, while its app has not
 *   started. The helper is left for the rest: a page that has used up those loads, the HTML of a deployment before
 *   that one, and the files that a page that has started asks for, which the viewer leaves to its app: the scripts of
 *   the map (Leaflet) and of the HEIC decoder (libheif), which webpack loads after the page's load event. So the page
 *   is watched until it shows `shown`.
 * - Only a 404 of the viewer's own server for a file under /_next/static/ counts. The helper then lets the page's load
 *   end and waits 2 seconds more, and loads the page again only if it is still the same document, is not loading,
 *   still misses such a file and still does not show `shown`, and `timeout` has not passed; otherwise it goes back to
 *   watching. A load of its own would stop the page's: in an emulation of the two by the viewer's session, against a
 *   server that answered in up to 600 ms, they stopped each other in 5 of 12 runs whose page needed its third load
 *   (page.reload: net::ERR_ABORTED), and with those checks, 48 of 48 runs passed. In this suite, against the viewer
 *   of 1b42c3c, a page given broken HTML once was loaded again by the viewer alone, and a page given it four times
 *   was loaded again by the viewer three times and then by the helper. Any other failure, and a page that still shows
 *   nothing when `timeout` has passed, fails the case with what the page shows (describeViewerPage).
 * - A load of the helper's waits only until the new document commits, and the helper then watches it as before: the
 *   page's load event can wait on a file that `shown` does not need, such as a font.
 * - A load is let end before the next one. A new load stops one that is still going, as loading the page again 3
 *   seconds early did in a reproduction: loadURL() then rejects with ERR_ABORTED (-3), an unhandled error, whose
 *   dialog holds the main process in the suite (load-viewer-page.ts).
 * - Not chosen: rerunning the case (Playwright's retries), which would also pass a real failure that does not happen
 *   every time; serving the viewer from a local build (PLM_TEST_PHOTO_DATA_VIEWER_SERVER), which needs Photo Data
 *   Viewer's checkout in CI and would no longer check the viewer that users get; Skew Protection, a setting of the
 *   viewer's own Vercel project.
 */
async function expectShownInViewer(viewer, shown, timeout = 30000) {
  const deadline = Date.now() + timeout;
  // At least 1 ms, as a timeout of 0 is none.
  const left = () => Math.max(deadline - Date.now(), 1);
  const missingFiles = () => viewer.evaluate(() => performance.getEntriesByType('resource')
    .filter(entry => entry.responseStatus === 404 && entry.name.startsWith(`${location.origin}/_next/static/`))
    .map(entry => entry.name.slice(location.origin.length))).catch(() => []);
  // expect.poll() does not poll again after a function that throws, as one that reads a page being loaded can.
  const state = async () => await shown.isVisible().catch(() => false) ? 'shown'
    : (await missingFiles()).length ? 'missing files' : 'loading';
  // Each load of the page makes a new document, with a time origin of its own.
  const currentDocument = () => viewer.evaluate(() => performance.timeOrigin).catch(() => undefined);
  const viewerWindow = await app.browserWindow(viewer);
  const isLoading = () => viewerWindow.evaluate(window => window.webContents.isLoading()).catch(() => true);
  const notShown = async error => {
    throw new Error(`The page of Photo Data Viewer did not show ${shown} within ${timeout} ms.\n${await describeViewerPage(viewer)}`,
      { cause: error });
  };
  for (;;) {
    // Decided by what ended the poll. A second look could find the document of a load that the page made meanwhile,
    // still loading, and the helper would then no longer load that page again. A poll that outlives its test ends
    // without a look, so anything but 'missing files' leaves the loop.
    let seen;
    await expect.poll(async () => (seen = await state()), { timeout: left(), intervals: [100, 250] }).not.toBe('loading')
      .catch(notShown);
    if (seen !== 'missing files') break;
    const missingDocument = await currentDocument();
    await expect.poll(isLoading, { timeout: left() }).toBe(false).catch(notShown);
    await viewer.waitForTimeout(Math.min(2000, left()));
    if (await currentDocument() !== missingDocument || await isLoading() || await state() !== 'missing files') continue;
    if (Date.now() >= deadline) await notShown(new Error('The page was still missing files of its own build.'));
    console.log(`Photo Data Viewer's server did not have ${(await missingFiles()).join(', ')}, of the page's own build: `
      + 'loading the page again.');
    await viewer.reload({ timeout: left(), waitUntil: 'commit' }).catch(notShown);
  }
  await expect(shown).toBeVisible({ timeout: left() }).catch(notShown);
}
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
    await expectShownInViewer(viewer, viewer.locator('img[alt]').filter({ hasNotText: 'dummy' }).first());
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
    // The photo's URL is the viewer's alone, and it ends with the window. The main window's page cannot read it: its
    // Content Security Policy refuses the fetch, and the main process would answer only the viewer's page.
    const { url } = await viewer.evaluate(() => window.plmPhotoDataViewer.readPhoto());
    expect(url).toMatch(/^plm-photo:\/\/photo\/[0-9a-f]{64}$/);
    expect(await page.evaluate(url => fetch(url).then(answer => answer.status, error => error.name), url)).toBe('TypeError');
    await expect.poll(() => policyViolations.some(line => line.includes(`'${url}'`))).toBe(true);
    // That line, and the fetch's second one, which gives the address without quotes.
    takePolicyViolations(line => line.includes(url));
    const status = referrer => app.evaluate(async ({ app }, { url, referrer }) => {
      const require = globalThis.__plmTestRequire;
      const delivery = require(require('node:path').join(app.getAppPath(), 'out/app/src-main/photo-data-viewer/photo-delivery.js'));
      // What protocol.handle passes for the viewer's fetch(): the URL, the mode and the referrer that Chromium sets.
      const request = { url, mode: 'cors', referrer, headers: new Headers() };
      return (await delivery.respondToPhotoRequest(request)).status;
    }, { url, referrer });
    const viewerReferrer = `${new URL(viewer.url()).origin}/`;
    expect(await status(page.url())).toBe(403);
    expect(await status(viewerReferrer)).toBe(200);
    await viewerWindow.evaluate(window => new Promise(resolve => { window.once('closed', resolve); window.close(); }));
    expect(await status(viewerReferrer)).toBe(404);
  });
}
test('a link of Photo Data Viewer to Google Maps or Google Earth opens in the browser, recorded without the place', async () => {
  await dismissWelcome();
  const photo = path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG');
  await openFolderWithPicker(path.dirname(photo));
  const newWindow = app.waitForEvent('window');
  await page.evaluate(photo => window.plm.photoDataViewer.open({ photo: { name: 'IMG_4676.JPG', path: photo } }), photo);
  const viewer = await newWindow;
  // The address tells the viewer that it may show its Google Earth button, as such a link is recorded so.
  await viewer.waitForURL(url => url.searchParams.get('plmBridge') === '1');
  expect(new URL(viewer.url()).searchParams.get('googleEarth')).toBe('1');
  // What the viewer's buttons open, with the photo's latitude and longitude, opened as a button opens them.
  const openedUrls = await recordOpenedUrls();
  const links = ['https://maps.google.com/?q=34.69,135.19&ll=34.69,135.19&z=14', 'https://earth.google.com/web/search/34.69,135.19'];
  await viewer.evaluate(links => { for (const link of links) window.open(link, '_blank'); }, links);
  await expect.poll(async () => (await openedUrls()).toSorted()).toEqual(links.toSorted());
  const recorded = service => app.evaluate((_electron, service) => globalThis.__plmAnalyticsEvents
    .filter(event => event.service === service && event.action === 'Opened URL')
    .map(event => event.value)
    .sort(), service);
  for (const service of ['amplitude', 'mixpanel']) {
    await expect.poll(() => recorded(service), { timeout: 20000 })
      .toEqual(['URL including https://earth.google.com/', 'URL including https://maps.google.com/']);
  }
});
test('closing Photo Data Viewer while its page loads shows and records no error', async () => {
  await dismissWelcome();
  const photo = path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG');
  await openFolderWithPicker(path.dirname(photo));
  // The viewer's window is closed as soon as its page starts to load, as a user can close it as soon as it appears.
  // A dialog of an unhandled error is recorded instead of shown, as it would hold the main process.
  await app.evaluate(({ app, dialog }) => {
    globalThis.__plmE2eErrorDialogs = [];
    dialog.showMessageBoxSync = options => {
      globalThis.__plmE2eErrorDialogs.push(options);
      return 0;
    };
    globalThis.__plmE2eViewerClosed = new Promise(resolve => app.once('browser-window-created', (_event, window) => {
      window.once('closed', resolve);
      window.webContents.once('did-start-loading', () => window.close());
    }));
  });
  await page.evaluate(({ name, photo }) => window.plm.photoDataViewer.open({ photo: { name, path: photo } }),
    { name: path.basename(photo), photo });
  await app.evaluate(() => globalThis.__plmE2eViewerClosed);
  // The load that the closing stopped rejects at once; give it time to reach the handler of unhandled errors.
  await page.waitForTimeout(1000);
  expect(await app.evaluate(() => globalThis.__plmE2eErrorDialogs.map(options => options.detail))).toEqual([]);
  expect(await app.evaluate(() => globalThis.__plmAnalyticsEvents
    .filter(event => event.action === 'Unhandled Error (Main)').map(event => event.label))).toEqual([]);
});
test('Photo Data Viewer opens first wide enough to split its panes, in the middle of the main window\'s display, and then where the user left it', async () => {
  await dismissWelcome();
  const photo = path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG');
  await openFolderWithPicker(path.dirname(photo));
  const openViewer = async () => {
    const newWindow = app.waitForEvent('window');
    await page.evaluate(photo => window.plm.photoDataViewer.open({ photo: { name: 'IMG_4676.JPG', path: photo } }), photo);
    const viewer = await newWindow;
    return { viewer, viewerWindow: await app.browserWindow(viewer) };
  };
  const bounds = window => window.evaluate(window => window.getBounds());
  // The default bounds, 1240x800 where the work area has the room (src-main/photo-data-viewer/photo-data-viewer-window-state.ts).
  const area = await (await app.browserWindow(page)).evaluate(window =>
    globalThis.__plmTestRequire('electron').screen.getDisplayMatching(window.getBounds()).workArea);
  const width = Math.min(1240, area.width);
  const height = Math.min(800, area.height);
  const { viewer, viewerWindow } = await openViewer();
  expect(await bounds(viewerWindow)).toEqual({ x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2), width, height });
  // The viewer splits its panes in a page wider than 1200 pixels: the photo and the map beside the data, which are
  // not behind the tabs of a single pane. The display may be too small for it, as the 1024x768 of CI's macOS and
  // Windows runners is; Ubuntu's, of 1280x1024, is not.
  if (width === 1240) {
    await expectShownInViewer(viewer, viewer.locator('.leaflet-container'));
    await expect(viewer.getByRole('tab', { name: 'General', exact: true })).toBeVisible();
    await expect(viewer.getByRole('tab', { name: 'Map', exact: true })).toHaveCount(0);
    expect(await viewer.evaluate(() => document.documentElement.clientWidth)).toBeGreaterThan(1200);
  }
  // Bounds that the user gave the window, saved when it closes, are where it opens next.
  const userBounds = { x: area.x + 30, y: area.y + 40, width: Math.min(720, area.width - 30), height: Math.min(560, area.height - 40) };
  await viewerWindow.evaluate((window, userBounds) => window.setBounds(userBounds), userBounds);
  await expect.poll(() => bounds(viewerWindow)).toEqual(userBounds);
  await viewerWindow.evaluate(window => new Promise(resolve => { window.once('closed', resolve); window.close(); }));
  expect(await bounds((await openViewer()).viewerWindow)).toEqual(userBounds);
});
test('Photo Data Viewer saved where no display is now opens with its size in the middle of the main window\'s display', async () => {
  await dismissWelcome();
  const photo = path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG');
  await openFolderWithPicker(path.dirname(photo));
  // Bounds saved on a display that is no longer connected, at the right of every display there is, written as the
  // window writes them when it closes (src-main/photo-data-viewer/photo-data-viewer-window-state.ts).
  const saved = { width: 720, height: 560 };
  await app.evaluate(async ({ app, screen }, saved) => {
    const require = globalThis.__plmTestRequire;
    const appModule = file => require(require('node:path').join(app.getAppPath(), 'out/app', file));
    const { UserDataStorage } = appModule('src-shared/user-data-storage/user-data-storage.js');
    const { UserDataStoragePath } = appModule('src-shared/user-data-storage/user-data-stroage-path.js');
    const right = Math.max(...screen.getAllDisplays().map(({ bounds }) => bounds.x + bounds.width));
    const values = { WindowX: right + 1000, WindowY: 40, WindowWidth: saved.width, WindowHeight: saved.height };
    for (const [name, value] of Object.entries(values))
      await UserDataStorage.write(UserDataStoragePath.PhotoDataViewer[name], `${value}`);
  }, saved);
  const area = await (await app.browserWindow(page)).evaluate(window =>
    globalThis.__plmTestRequire('electron').screen.getDisplayMatching(window.getBounds()).workArea);
  const width = Math.min(saved.width, area.width);
  const height = Math.min(saved.height, area.height);
  const newWindow = app.waitForEvent('window');
  await page.evaluate(photo => window.plm.photoDataViewer.open({ photo: { name: 'IMG_4676.JPG', path: photo } }), photo);
  const viewerWindow = await app.browserWindow(await newWindow);
  expect(await viewerWindow.evaluate(window => window.getBounds())).toEqual({ x: area.x + Math.round((area.width - width) / 2),
    y: area.y + Math.round((area.height - height) / 2), width, height });
});
test('the page shows the photos of a folder that the user opened, and no other file', async () => {
  // The page's web security is on: no file: URL loads, and plm-file: answers only for the opened folders
  // (src-main/file-server/photo-files.ts).
  await dismissWelcome();
  const folder = path.join(photoFolder, 'Kobe');
  await openFolderWithPicker(folder);
  await expect(page.locator('app-loaded-files-status-bar')).toContainText('files have location data.');
  const loads = src => page.evaluate(src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0);
    image.onerror = () => resolve(false);
    image.src = src;
  }), src);
  const photoFileUrl = filePath => `plm-file://local/${encodeURIComponent(filePath)}`;
  const inside = path.join(folder, 'IMG_4676.JPG');
  expect(await loads(photoFileUrl(inside))).toBe(true);
  expect(await loads(photoFileUrl(path.join(photoFolder, 'Unga', 'IMG_2581.JPG')))).toBe(false);
  expect(await loads(photoFileUrl(`${folder}${path.sep}..${path.sep}Unga${path.sep}IMG_2581.JPG`))).toBe(false);
  expect(await loads(pathToFileURL(inside).href)).toBe(false);
});
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
    // The landing page in English: the one as it is would be in the language of the computer that the suite runs on.
  }, pathToFileURL(path.join(root, 'docs/en/index.html')).href);
  page = await websiteWindow;
  const setContentSize = (width, height) => app.evaluate(({ BrowserWindow }, [width, height]) =>
    BrowserWindow.getAllWindows().find(window => window.webContents.getURL().includes('/docs/')).setContentSize(width, height), [width, height]);
  await expect(page.locator('.title')).toHaveText('Photo Location Map');
  await expect(page.getByRole('link', { name: 'Download for Windows' }))
    .toHaveAttribute('href', '../github-pages/downloading-for-windows/downloading-for-windows.html?lang=en');
  // The demo video's frame stays empty: the suite cancels YouTube, whose error message for a page read from a file:
  // address took the focus and scrolled the page to the frame (electron-util/e2e-test-hooks.js).
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
  await expect(page).toHaveURL(/downloading-for-windows\.html\?lang=en$/);
  await expect.poll(() => app.evaluate(() => globalThis.__plmDownloads.some(url => url.endsWith('.exe')))).toBe(true);
});
/**
 * Serves docs/, the website, at an address of this computer, as GitHub Pages serves it: a page opened from the disk
 * cannot fetch the texts of a language. hold() keeps the answers for a file back until what it returns is called.
 */
async function serveWebsite() {
  const docs = path.join(root, 'docs');
  const held = new Map();
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.ico': 'image/x-icon', '.png': 'image/png' };
  const server = createServer(async (request, response) => {
    // An address that cannot be read, as one with a malformed percent sequence, is answered as a file that is not
    // there: an error thrown here would otherwise be a rejection that nothing handles.
    try {
      const { pathname } = new URL(request.url, 'http://127.0.0.1');
      // The installer that a case has the Windows download page download in place of GitHub's: a file to save, as
      // GitHub's is, which the browser downloads without leaving the page.
      if (pathname === '/installer.exe') {
        response.writeHead(200, { 'content-type': 'application/octet-stream', 'content-disposition': 'attachment; filename="installer.exe"' })
          .end('not an installer');
        return;
      }
      const file = path.join(docs, decodeURIComponent(pathname.endsWith('/') ? `${pathname}index.html` : pathname));
      if (!file.startsWith(docs + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      const body = await readFile(file);
      await held.get(pathname);
      response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const hold = pathname => {
    let release;
    held.set(pathname, new Promise(resolve => {
      release = () => {
        held.delete(pathname);
        resolve();
      };
    }));
    return release;
  };
  const url = `http://127.0.0.1:${server.address().port}/`;
  return { url, installer: `${url}installer.exe`, hold, close: () => new Promise(resolve => server.close(resolve)) };
}
test('download website is in the language of its address, and in the one chosen in its picker, on both of its pages', async () => {
  test.skip(!!packagedExecutable, 'The static website is verified separately from the packaged application.');
  const website = await serveWebsite();
  try {
    // TL;DR: The pages' analytics events are answered here rather than sent, and listed for the window across its page
    // loads.
    // Details: The suite cancels the requests of analytics (electron-util/e2e-test-hooks.js), and analytics.js sends a
    // batch that fails again only seconds later. A page that is left sends what it has not sent yet, and the next page
    // sends that again, which the list has once, by the event's ID.
    await app.context().addInitScript(() => {
      const listed = () => JSON.parse(sessionStorage.getItem('plmWebsiteAnalytics') ?? '[]');
      Object.defineProperty(globalThis, '__plmWebsiteAnalytics', { get: listed });
      const fetchOfPage = globalThis.fetch;
      globalThis.fetch = (resource, options) => {
        if (!String(resource).endsWith('/landing-page/v1/events')) return fetchOfPage(resource, options);
        const events = listed();
        for (const event of JSON.parse(options.body).events) {
          if (!events.some(each => each.eventId === event.event_id))
            events.push({ eventId: event.event_id, action: event.action, ...JSON.parse(event.label) });
        }
        sessionStorage.setItem('plmWebsiteAnalytics', JSON.stringify(events));
        return Promise.resolve(new Response(null, { status: 204 }));
      };
    });
    /**
     * The fields of the analytics events with `action` of the page as it was last loaded, or of the page load `back`
     * before it: a page that is left sends a choice that it made in its picker.
     */
    const websiteEvents = (action, back = 0) => page.evaluate(([action, back]) => {
      const events = globalThis.__plmWebsiteAnalytics;
      const pageLoads = events.filter(event => event.action === 'Page Loaded').map(event => event.pageLoadId);
      const pageLoadId = pageLoads[pageLoads.length - 1 - back];
      return events.filter(event => event.action === action && event.pageLoadId === pageLoadId);
    }, [action, back]);
    // The landing page in Japanese, by its address, as a search engine links to it. The browser's own language is that
    // of the computer, so the address says the language in every step here.
    const websiteWindow = app.waitForEvent('window');
    await app.evaluate(({ app, BrowserWindow }, url) => {
      const require = globalThis.__plmTestRequire;
      const { withHeadlessTestOptions } = require(require('node:path').join(app.getAppPath(), 'out/app/electron-util/e2e-test-hooks.js'));
      const window = new BrowserWindow(withHeadlessTestOptions({ useContentSize: true, width: 1200, height: 800 }));
      void window.loadURL(url);
    }, `${website.url}ja/`);
    page = await websiteWindow;
    await expect(page.locator('.app-summary')).toHaveText('写真の撮影場所をマップに表示します。');
    // The language of the address is a choice, which is kept for the landing page as it is and the download page.
    expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('PhotoLocationMapWebsiteLanguage')])).toEqual(['ja', 'ja']);
    // The page load is sent to the analytics backend with the browser's languages, the Language setting, which the
    // address made Japanese, and the language that the page is in.
    const [browserLanguage, browserLanguages] = await page.evaluate(() => [navigator.language, [...navigator.languages]]);
    await expect.poll(() => websiteEvents('Page Loaded')).toEqual([expect.objectContaining({ page: 'landing',
      language: browserLanguage, languages: browserLanguages, languageSetting: 'ja', languageInUse: 'ja' })]);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', '写真の撮影場所をマップに表示します。');
    await expect(page.getByRole('button', { name: 'macOS 版をダウンロード' })).toBeVisible();
    // A sentence with a link keeps the link, around the words that are the link in Japanese.
    const troubleshooting = page.locator('.troubleshooting');
    await expect(troubleshooting).toHaveText('このアプリで問題が起きたときは、トラブルシューティングのページをご覧ください。');
    await expect(troubleshooting.getByRole('link')).toHaveText('トラブルシューティングのページ');
    await expect(troubleshooting.getByRole('link')).toHaveAttribute('href', /troubleshooting\.md$/);
    // The language picker: a button with a globe and the page's language, which a screen reader calls the language.
    const pickerButton = page.locator('.language-button');
    const chosenOnButton = pickerButton.locator('.language-button-name');
    await expect(page.getByRole('button', { name: '言語 日本語', exact: true })).toBeVisible();
    await expect(pickerButton).toHaveAttribute('aria-expanded', 'false');
    const globe = await pickerButton.locator('.language-globe').boundingBox();
    expect(globe.width).toBeGreaterThan(0);
    expect(globe.x + globe.width).toBeLessThanOrEqual((await chosenOnButton.boundingBox()).x);
    await shot('website-desktop-ja', [page.locator('iframe')]);
    // It opens a box under it, with a search field above the list of languages, as the application's list has: each
    // language under its own name, and the page's language chosen. The search field is ready to be typed in.
    const pickerBox = page.locator('#language-popup');
    await pickerButton.click();
    await expect(page.getByRole('dialog', { name: '言語' })).toBeVisible();
    await expect(pickerButton).toHaveAttribute('aria-expanded', 'true');
    const search = pickerBox.getByRole('searchbox', { name: '検索' });
    await expect(search).toBeFocused();
    await expect(search).toHaveAttribute('placeholder', '検索');
    // "Use browser setting", written in the language that the browser stands for and with its name, as the
    // application's list has the operating system's: the language of the computer that the suite runs on. Then the
    // application's languages, in the order of its list. With more of them than the box shows, the list scrolls: it
    // ends half an entry down, so that it is seen to go on, and shows the chosen language. The address asked for
    // Japanese, so the page does not follow the browser.
    const browserCode = matchLanguage(await page.evaluate(() => navigator.languages)) ?? 'en';
    const browserName = websiteLanguages.find(language => language.code === browserCode).name;
    const options = pickerBox.getByRole('listbox', { name: '言語' }).getByRole('option');
    const languageOptions = pickerBox.locator('.language-option[data-code]');
    const optionOf = name => pickerBox.getByRole('option', { name, exact: true });
    const browserEntry = pickerBox.locator('#language-option-browser');
    await expect(options).toHaveText([browserSettingLabels[browserCode], ...languageNames]);
    await expect(browserEntry).toHaveAttribute('lang', browserCode);
    await expect(optionOf('日本語')).toHaveAttribute('aria-selected', 'true');
    await expect(browserEntry).toHaveAttribute('aria-selected', 'false');
    await expect(pickerBox.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);
    await expect(optionOf('日本語')).toBeInViewport({ ratio: 1 });
    expect(await pickerBox.getByRole('listbox').evaluate(list => [list.scrollHeight > list.clientHeight, list.clientHeight / list.firstElementChild.offsetHeight]))
      .toEqual([true, 7.5]);
    // A magnifying glass at the end of the search field, 8 pixels from its right edge and in the middle of its height.
    const searchBox = await search.boundingBox();
    const magnifier = await pickerBox.locator('.language-search-icon').boundingBox();
    expect(searchBox.x + searchBox.width - (magnifier.x + magnifier.width)).toBeCloseTo(8, 0);
    expect(magnifier.y + magnifier.height / 2).toBeCloseTo(searchBox.y + searchBox.height / 2, 0);
    const buttonBox = await pickerButton.boundingBox();
    const boxBox = await pickerBox.boundingBox();
    expect(boxBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);
    expect(Math.abs(boxBox.x + boxBox.width - (buttonBox.x + buttonBox.width))).toBeLessThan(1);
    await shot('website-picker-ja', [page.locator('iframe')]);
    // The search finds a language by its own name, its English name, its name in the page's language or its code, and
    // says when it finds none.
    for (const [typed, found] of [['engl', ['English']], ['日本', ['日本語']], ['英語', ['English']], ['ドイツ', ['Deutsch']], ['JA', ['日本語']],
      ['deu', ['Deutsch']], ['portug', ['Português (Brasil)', 'Português (Portugal)']], ['zh-hant', ['繁體中文']]]) {
      await search.fill(typed);
      await expect(languageOptions.filter({ visible: true })).toHaveText(found);
    }
    // The first entry is found by its words in the page's language, as the application's is, whatever language it is
    // written in.
    await search.fill('ブラウザ');
    await expect(options.filter({ visible: true })).toHaveText([browserSettingLabels[browserCode]]);
    await search.fill('xyz');
    await expect(options.filter({ visible: true })).toHaveCount(0);
    await expect(pickerBox.getByRole('status')).toHaveText('言語が見つかりません');
    // Escape closes the box without a choice, and gives the keyboard's focus back to the button.
    await search.press('Escape');
    await expect(pickerBox).toBeHidden();
    await expect(pickerButton).toBeFocused();
    await expect(pickerButton).toHaveAttribute('aria-expanded', 'false');
    // The keyboard reaches the list from the search field, and moves in it; a click outside closes the box.
    await pickerButton.press('Enter');
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
    await search.press('ArrowDown');
    await expect(optionOf('日本語')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(optionOf('한국어')).toBeFocused();
    // Letters typed on the list move to the language whose name starts with them, as in the application's list.
    await page.keyboard.type('de');
    await expect(optionOf('Deutsch')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(browserEntry).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(optionOf('Bahasa Indonesia')).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowUp');
    await expect(search).toBeFocused();
    await page.locator('.app-summary').click();
    await expect(pickerBox).toBeHidden();
    await expect(chosenOnButton).toHaveText('日本語');
    // On a phone, where the two download buttons are one above the other, each keeps its text on one line, as it has
    // at this width, and both are as wide as the wider. The Japanese texts are longer than the English ones, for
    // which the buttons had their width.
    const downloadButtons = () => page.locator('.download-buttons > *').evaluateAll(buttons => buttons.map(button => {
      const { width, height } = button.getBoundingClientRect();
      return { width: Math.round(width), height: Math.round(height) };
    }));
    const buttonsDirection = () => page.locator('.download-buttons').evaluate(element => getComputedStyle(element).flexDirection);
    const setContentSize = (width, height) => app.evaluate(({ BrowserWindow }, [address, width, height]) =>
      BrowserWindow.getAllWindows().find(window => window.webContents.getURL().startsWith(address)).setContentSize(width, height), [website.url, width, height]);
    const heightsOnOneLine = (await downloadButtons()).map(button => button.height);
    await setContentSize(390, 800);
    await expect.poll(buttonsDirection).toBe('column');
    const buttonsOnPhone = await downloadButtons();
    expect(buttonsOnPhone.map(button => button.height)).toEqual(heightsOnOneLine);
    expect(buttonsOnPhone[0].width).toBe(buttonsOnPhone[1].width);
    /**
     * The narrowest window in which the two buttons fit side by side, in the page's language and with this machine's
     * fonts: their widths with their margins, and what the page leaves beside the room that their row has.
     */
    const windowForARow = async () => {
      await setContentSize(700, 800);
      await expect.poll(buttonsDirection).toBe('row');
      return page.locator('.download-buttons').evaluate(row => {
        const container = getComputedStyle(row.parentElement);
        const room = row.parentElement.clientWidth - parseFloat(container.paddingLeft) - parseFloat(container.paddingRight);
        return Math.ceil([...row.children].reduce((width, button) => {
          const style = getComputedStyle(button);
          return width + button.getBoundingClientRect().width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        }, window.innerWidth - room));
      });
    };
    // In a window a little narrower than that, and wider than a phone, the two do not fit side by side in Japanese,
    // where each text was then on two lines: they are one above the other, both as wide as the wider. With a font
    // that makes the Japanese texts as short as the English ones, there is no such window.
    const japaneseRow = await windowForARow();
    if (japaneseRow - 10 > 500) {
      await setContentSize(japaneseRow - 10, 800);
      await expect.poll(buttonsDirection).toBe('column');
      const buttonsInNarrowWindow = await downloadButtons();
      expect(buttonsInNarrowWindow.map(button => button.height)).toEqual(heightsOnOneLine);
      expect(buttonsInNarrowWindow[0].width).toBe(buttonsInNarrowWindow[1].width);
    }
    await setContentSize(Math.max(japaneseRow, 501) + 10, 800);
    await expect.poll(buttonsDirection).toBe('row');
    await setContentSize(1200, 800);
    await expect.poll(buttonsDirection).toBe('row');
    // English, typed in the search field and chosen with Enter: the landing page in English.
    await pickerButton.click();
    await search.fill('english');
    await search.press('Enter');
    await expect(page).toHaveURL(`${website.url}en/`);
    await expect(page.locator('.app-summary')).toHaveText('Display the locations where photos were taken on a map.');
    // The new setting is sent to the analytics backend, with the language that the page is then in, by the page in
    // Japanese that was left; the page in English is loaded with it.
    await expect.poll(() => websiteEvents('Changed Language Setting', 1))
      .toEqual([expect.objectContaining({ page: 'landing', languageSetting: 'en', languageInUse: 'en' })]);
    await expect.poll(() => websiteEvents('Page Loaded'))
      .toEqual([expect.objectContaining({ page: 'landing', languageSetting: 'en', languageInUse: 'en' })]);
    // The English texts are shorter: the two buttons fit side by side in the window in which the Japanese ones did
    // not, and are side by side there, as they were before the website had other languages.
    const englishRow = await windowForARow();
    if (japaneseRow - 10 > Math.max(englishRow, 500) + 10) {
      await setContentSize(japaneseRow - 10, 800);
      await expect.poll(buttonsDirection).toBe('row');
      expect((await downloadButtons()).map(button => button.height)).toEqual(heightsOnOneLine);
    }
    // On a narrow phone, the sentence about the source code takes more than one line, and its lines are of about the
    // same length. The application's name is on one of them, not divided between two: i18n.js gives it no-break
    // spaces.
    await setContentSize(320, 800);
    await expect.poll(buttonsDirection).toBe('column');
    const linesOnPhone = await page.locator('[data-i18n="landing.sourceCode"]').evaluate(sentence => {
      const linesOf = range => new Set([...range.getClientRects()].map(line => Math.round(line.top))).size;
      const whole = document.createRange();
      whole.selectNodeContents(sentence);
      const text = sentence.firstChild;
      const name = document.createRange();
      name.setStart(text, text.data.search(/Photo\sLocation\sMap/));
      name.setEnd(text, text.data.search(/Photo\sLocation\sMap/) + 'Photo Location Map'.length);
      return { sentence: linesOf(whole), name: linesOf(name) };
    });
    expect(linesOnPhone.sentence).toBeGreaterThan(1);
    expect(linesOnPhone.name).toBe(1);
    await setContentSize(1200, 800);
    await expect.poll(buttonsDirection).toBe('row');
    await expect(troubleshooting.getByRole('link')).toHaveText('the troubleshooting page');
    await expect(page.getByRole('button', { name: 'Language English', exact: true })).toBeVisible();
    expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('PhotoLocationMapWebsiteLanguage')])).toEqual(['en', 'en']);
    /** Chooses a language in the picker with the mouse, by its own name. */
    const chooseLanguage = async name => {
      await pickerButton.click();
      await pickerBox.getByRole('option', { name, exact: true }).click();
      await expect(pickerBox).toBeHidden();
    };
    // TL;DR: The download page shows itself in a chosen language in place, with the texts of the language, which can
    // come late: from here on, a page lists the texts that it has dealt with.
    // Details: Whether late texts change the page can be told only once the page has dealt with them. Each reading
    // of texts in the page, a call of Response.json(), is listed by its file one task after the texts are read: what
    // the page does with them follows their reading as microtasks of the same task (docs/github-pages/i18n.js). The
    // page is loaded anew for this, in English, for which it asks for no texts.
    await page.addInitScript(() => {
      globalThis.__plmTextsDealtWith = [];
      const json = Response.prototype.json;
      Response.prototype.json = function () {
        const read = json.call(this);
        const file = this.url.split('?')[0].split('/').pop();
        const dealtWith = () => setTimeout(() => globalThis.__plmTextsDealtWith.push(file));
        read.then(dealtWith, dealtWith);
        return read;
      };
    });
    /** Waits until the page has dealt with the texts of these files, in this order, since it was loaded. */
    const textsDealtWith = files => expect.poll(() => page.evaluate(() => globalThis.__plmTextsDealtWith)).toEqual(files);
    // TL;DR: The download page starts its download as on GitHub Pages, at each of its loads, and is in its language all
    // the same.
    // Details: The page goes to the installer's address, where the browser finds a file to save and stays on the page.
    // The suite cancels the requests for GitHub's installers, which would leave the page for the browser's error page,
    // so the installer here is this server's (electron-util/e2e-test-hooks.js). Started while the page loaded, the
    // download stopped the loading, and the page stayed in English, without its picker (downloading-for-windows.html).
    await app.evaluate((_electron, installer) => { globalThis.__plmInstallerRedirect = installer; }, website.installer);
    const downloadPage = `${website.url}github-pages/downloading-for-windows/downloading-for-windows.html`;
    const isInEnglish = async () => {
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to install');
      await expect(chosenOnButton).toHaveText('English');
      await expect(page).toHaveURL(`${downloadPage}?lang=en`);
      expect(await page.evaluate(() => [document.documentElement.lang, localStorage.getItem('PhotoLocationMapWebsiteLanguage')])).toEqual(['en', 'en']);
    };
    await page.goto(`${downloadPage}?lang=en`, { waitUntil: 'domcontentloaded' });
    await isInEnglish();
    // Only the last choice counts. Japanese and then English are chosen while the Japanese texts are on their way:
    // when they arrive, after the English ones, the page stays in English, as do its address and the kept choice.
    const textsOf = language => `/github-pages/locales/${language}.json`;
    const sendJapaneseTexts = website.hold(textsOf('ja'));
    await chooseLanguage('日本語');
    await chooseLanguage('English');
    await textsDealtWith(['en.json']);
    sendJapaneseTexts();
    await textsDealtWith(['en.json', 'ja.json']);
    await isInEnglish();
    // The texts that a page is loaded with can come late as well. Japanese by the address, with its texts held back:
    // the page is shown in English after a second and a half, and has its picker by then, in which English is chosen.
    // When the Japanese texts arrive after that, the page stays in English.
    const sendLateTexts = website.hold(textsOf('ja'));
    await page.goto(`${downloadPage}?lang=ja`, { waitUntil: 'domcontentloaded' });
    await expect(pickerButton).toBeVisible();
    await expect(chosenOnButton).toHaveText('English');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to install');
    await chooseLanguage('English');
    await textsDealtWith(['en.json']);
    await isInEnglish();
    sendLateTexts();
    await textsDealtWith(['en.json', 'ja.json']);
    await isInEnglish();
    // Arabic, which is written from right to left: the page is laid out so. The picker is at the page's left, where
    // its lines end, with the box under it at the button's left edge and the magnifying glass at the left of the
    // search field. The list of formats has its bullets at the right.
    await page.goto(`${website.url}ar/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-summary')).toHaveText('عرض أماكن التقاط الصور على الخريطة.');
    expect(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir])).toEqual(['ar', 'rtl']);
    await expect(chosenOnButton).toHaveText('العربية');
    await pickerButton.click();
    await expect(pickerBox.getByRole('searchbox', { name: 'بحث' })).toBeFocused();
    // The first entry is in the browser's language, on a page in Arabic as on any other.
    await expect(browserEntry).toHaveText(browserSettingLabels[browserCode]);
    await expect(browserEntry).toHaveAttribute('lang', browserCode);
    const buttonInArabic = await pickerButton.boundingBox();
    const boxInArabic = await pickerBox.boundingBox();
    expect(buttonInArabic.x + buttonInArabic.width).toBeLessThan(600);
    expect(Math.abs(boxInArabic.x - buttonInArabic.x)).toBeLessThan(1);
    const searchInArabic = await pickerBox.getByRole('searchbox').boundingBox();
    const magnifierInArabic = await pickerBox.locator('.language-search-icon').boundingBox();
    expect(magnifierInArabic.x - searchInArabic.x).toBeCloseTo(8, 0);
    expect(await page.locator('.supported-file-format ul').evaluate(list => [getComputedStyle(list).paddingRight, getComputedStyle(list).paddingLeft]))
      .toEqual(['40px', '0px']);
    await shot('website-picker-ar', [page.locator('iframe')]);
    await page.keyboard.press('Escape');
    await expect(pickerBox).toBeHidden();
    // "Use browser setting" goes to the landing page as it is, which follows the browser: in the browser's language,
    // with no choice kept, and with the entry chosen. The page in Arabic sent the setting, `auto`.
    await pickerButton.click();
    await browserEntry.click();
    await expect(page).toHaveURL(website.url);
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(browserCode);
    await expect(chosenOnButton).toHaveText(browserName);
    expect(await page.evaluate(() => localStorage.getItem('PhotoLocationMapWebsiteLanguage'))).toBeNull();
    await expect.poll(() => websiteEvents('Page Loaded'))
      .toEqual([expect.objectContaining({ page: 'landing', languageSetting: 'auto', languageInUse: browserCode })]);
    await expect.poll(() => websiteEvents('Changed Language Setting', 1))
      .toEqual([expect.objectContaining({ page: 'landing', languageSetting: 'auto', languageInUse: browserCode })]);
    // Chosen there again, the entry forgets a language that was kept meanwhile, and the page stays. So it is when Back
    // shows the page again from the browser's cache after a language was chosen in it: the page follows the browser
    // still, while that language is kept.
    await page.evaluate(() => localStorage.setItem('PhotoLocationMapWebsiteLanguage', 'de'));
    await pickerButton.click();
    await expect(browserEntry).toHaveAttribute('aria-selected', 'true');
    await browserEntry.click();
    await expect(pickerBox).toBeHidden();
    expect(await page.evaluate(() => [location.href, localStorage.getItem('PhotoLocationMapWebsiteLanguage')])).toEqual([website.url, null]);
    // Japanese again, laid out from left to right again. The Windows download page, whose link says the language, is
    // in it.
    await chooseLanguage('日本語');
    await expect(page).toHaveURL(`${website.url}ja/`);
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('ltr');
    await page.getByRole('link', { name: 'Windows 版をダウンロード' }).click();
    await expect(page).toHaveURL(`${downloadPage}?lang=ja`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('インストール方法');
    await expect(page.locator('.install-step').first()).toHaveText('1. ダウンロードした exe ファイルをダブルクリックします。');
    await expect(page.locator('.windows-defender-more-info')).toHaveAttribute('alt', 'Windows Defender SmartScreen の画像（詳細情報）');
    await expect(page).toHaveTitle('Photo Location Map をダウンロード中');
    await expect(chosenOnButton).toHaveText('日本語');
    await expect.poll(() => app.evaluate(() => globalThis.__plmDownloads.some(url => url.endsWith('/installer.exe')))).toBe(true);
    await expect(page).toHaveURL(`${downloadPage}?lang=ja`);
    await expect.poll(() => websiteEvents('Page Loaded'))
      .toEqual([expect.objectContaining({ page: 'downloading-for-windows', languageSetting: 'ja', languageInUse: 'ja' })]);
    await pickerButton.click();
    await expect(pickerBox.getByRole('option', { name: '日本語', exact: true })).toHaveAttribute('aria-selected', 'true');
    // "Use browser setting" forgets the choice: the page is in the browser's language, its address says none, and
    // nothing is kept, so that it follows the browser on the next visit too, where the entry is the chosen one.
    await browserEntry.click();
    await expect(pickerBox).toBeHidden();
    // The kept choice goes once the texts of the browser's language are in the page, which may be Japanese already.
    await expect.poll(() => page.evaluate(() => localStorage.getItem('PhotoLocationMapWebsiteLanguage'))).toBeNull();
    expect(await page.evaluate(() => document.documentElement.lang)).toBe(browserCode);
    await expect(chosenOnButton).toHaveText(browserName);
    expect(new URL(page.url()).searchParams.has('lang')).toBe(false);
    // The setting sent for that is `auto`, with the browser's language as the page's.
    await expect.poll(() => websiteEvents('Changed Language Setting')).toEqual([expect.objectContaining({
      page: 'downloading-for-windows', languageSetting: 'auto', languageInUse: browserCode })]);
    await page.goto(downloadPage, { waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(browserCode);
    await expect(chosenOnButton).toHaveText(browserName);
    await expect.poll(() => websiteEvents('Page Loaded'))
      .toEqual([expect.objectContaining({ languageSetting: 'auto', languageInUse: browserCode })]);
    await pickerButton.click();
    await expect(browserEntry).toHaveAttribute('aria-selected', 'true');
    await expect(pickerBox.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);
    // Choosing the setting that the page has changes nothing, and sends nothing: of that choice and the next one, of
    // Japanese, only the next one is sent, as events are sent in their order a second after they are made. The page
    // has dealt with the first choice once it has read the texts of the browser's language for it, after those that it
    // was loaded with, which English has in the page itself.
    await browserEntry.click();
    await textsDealtWith(browserCode === 'en' ? ['en.json'] : [`${browserCode}.json`, `${browserCode}.json`]);
    await chooseLanguage('日本語');
    await expect.poll(() => websiteEvents('Changed Language Setting'))
      .toEqual([expect.objectContaining({ languageSetting: 'ja', languageInUse: 'ja' })]);
  } finally {
    // The other cases have the requests for GitHub's installers cancelled again.
    await app.evaluate(() => { delete globalThis.__plmInstallerRedirect; }).catch(() => {});
    await website.close();
  }
});
test('the website\'s language picker has its first entry in the browser\'s language, whatever language the page is in', async () => {
  test.skip(!!packagedExecutable, 'The static website is verified separately from the packaged application.');
  const website = await serveWebsite();
  const origin = new URL(website.url).origin;
  const initScripts = [];
  let browserLanguages;
  try {
    /**
     * Gives the website's pages `languages` as the browser's, which i18n.js reads from navigator, as a browser set to
     * them gives them: from the next page that is loaded on.
     */
    const setBrowserLanguages = async languages => {
      await browserLanguages?.dispose();
      browserLanguages = await app.context().addInitScript(([origin, languages]) => {
        if (location.origin !== origin) return;
        Object.defineProperty(navigator, 'languages', { get: () => Object.freeze([...languages]) });
        Object.defineProperty(navigator, 'language', { get: () => languages[0] });
      }, [origin, languages]);
    };
    // Every text that the first entry has, from when it is in the page: a page records them anew at each load.
    initScripts.push(await app.context().addInitScript(origin => {
      if (location.origin !== origin) return;
      const texts = [];
      globalThis.__plmBrowserEntryTexts = texts;
      new MutationObserver(() => {
        const text = document.querySelector('#language-option-browser')?.textContent;
        if (text !== undefined && texts.at(-1) !== text) texts.push(text);
      }).observe(document, { childList: true, subtree: true, characterData: true });
    }, origin));
    // The landing page in English, in a browser in Japanese.
    await setBrowserLanguages(['ja-JP', 'en-US']);
    const websiteWindow = app.waitForEvent('window');
    await app.evaluate(({ app, BrowserWindow }, url) => {
      const require = globalThis.__plmTestRequire;
      const { withHeadlessTestOptions } = require(require('node:path').join(app.getAppPath(), 'out/app/electron-util/e2e-test-hooks.js'));
      const window = new BrowserWindow(withHeadlessTestOptions({ useContentSize: true, width: 1200, height: 800 }));
      void window.loadURL(url);
    }, `${website.url}en/`);
    page = await websiteWindow;
    await expect(page.locator('.app-summary')).toHaveText('Display the locations where photos were taken on a map.');
    const pickerButton = page.locator('.language-button');
    const pickerBox = page.locator('#language-popup');
    const search = pickerBox.getByRole('searchbox');
    const options = pickerBox.getByRole('option');
    const browserEntry = pickerBox.locator('#language-option-browser');
    const entryText = browserEntry.locator('bdi');
    /** Where the texts of the first entry and of the entry of `code` start and end, measured in one frame. */
    const edgesBesideEntryOf = code => pickerBox.evaluate((box, code) => ['browser', code].map(id => {
      const { left, right } = box.querySelector(`#language-option-${id} bdi`).getBoundingClientRect();
      return { left, right };
    }), code);
    const entryTexts = () => page.evaluate(() => globalThis.__plmBrowserEntryTexts);
    /** The texts of languages that the page has asked for since it was loaded, by their files. */
    const textsAskedFor = () => page.evaluate(() => performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname).filter(pathname => pathname.includes('/locales/')));
    // The entry is in Japanese, the browser's language, as each language is under its own name, and from the first.
    // The page asked for no texts, of Japanese or of any language: it holds its own.
    await pickerButton.click();
    await expect(options).toHaveText(['ブラウザの設定に従う（日本語）', ...languageNames]);
    await expect(browserEntry).toHaveAttribute('lang', 'ja');
    await expect(entryText).toHaveCSS('direction', 'ltr');
    expect(await entryTexts()).toEqual(['ブラウザの設定に従う（日本語）']);
    expect(await textsAskedFor()).toEqual([]);
    // The search finds it by its words in the page's language as well, "Use browser setting (日本語)", and by its own.
    await search.fill('browser');
    await expect(options).toHaveText(['ブラウザの設定に従う（日本語）']);
    await search.fill('ブラウザ');
    await expect(options).toHaveText(['ブラウザの設定に従う（日本語）']);
    await search.press('Escape');
    // In a browser in Arabic, the entry is written from right to left, and starts where the page's lines start, at
    // the left, as the entry of Arabic does.
    await setBrowserLanguages(['ar-SA']);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await pickerButton.click();
    await expect(options.first()).toHaveText('استخدام إعداد المتصفح (العربية)');
    await expect(browserEntry).toHaveAttribute('lang', 'ar');
    await expect(entryText).toHaveCSS('direction', 'rtl');
    const [entryInArabic, arabic] = await edgesBesideEntryOf('ar');
    expect(entryInArabic.left).toBeCloseTo(arabic.left, 1);
    expect(await entryTexts()).toEqual(['استخدام إعداد المتصفح (العربية)']);
    await search.fill('browser');
    await expect(options).toHaveText(['استخدام إعداد المتصفح (العربية)']);
    await search.press('Escape');
    // On the landing page in Arabic, in a browser in English, the other way round: the entry is in English, from left
    // to right, and starts at the right, where the lines of that page start, as the entry of English does.
    await setBrowserLanguages(['en-US']);
    await page.goto(`${website.url}ar/`, { waitUntil: 'domcontentloaded' });
    await pickerButton.click();
    await expect(options.first()).toHaveText('Use browser setting (English)');
    await expect(browserEntry).toHaveAttribute('lang', 'en');
    await expect(entryText).toHaveCSS('direction', 'ltr');
    const [entryInEnglish, english] = await edgesBesideEntryOf('en');
    expect(entryInEnglish.right).toBeCloseTo(english.right, 1);
    await search.fill('المتصفح');
    await expect(options).toHaveText(['Use browser setting (English)']);
    await search.press('Escape');
    // In a browser in a language that the website does not have, the entry stands for English, and is written in it,
    // on the landing page in Japanese. Chosen, it goes to the landing page as it is, which is then in English.
    await setBrowserLanguages(['is-IS']);
    await page.goto(`${website.url}ja/`, { waitUntil: 'domcontentloaded' });
    await pickerButton.click();
    await expect(options.first()).toHaveText('Use browser setting (English)');
    await expect(browserEntry).toHaveAttribute('lang', 'en');
    await search.fill('ブラウザ');
    await expect(options).toHaveText(['Use browser setting (English)']);
    await browserEntry.click();
    await expect(page).toHaveURL(website.url);
    await expect(page.locator('.app-summary')).toHaveText('Display the locations where photos were taken on a map.');
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    // The download page, in a browser in Japanese, shows itself in German in place: the entry stays as it was, in
    // Japanese, and the search finds it by its words in German, "Browsereinstellung verwenden (日本語)". The page asked
    // for the texts of German only. It starts its download as on GitHub Pages, from this server.
    await app.evaluate((_electron, installer) => { globalThis.__plmInstallerRedirect = installer; }, website.installer);
    await setBrowserLanguages(['ja-JP']);
    await page.goto(`${website.url}github-pages/downloading-for-windows/downloading-for-windows.html?lang=en`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('How to install');
    await pickerButton.click();
    await expect(options.first()).toHaveText('ブラウザの設定に従う（日本語）');
    await pickerBox.getByRole('option', { name: 'Deutsch', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await pickerButton.click();
    await expect(options.first()).toHaveText('ブラウザの設定に従う（日本語）');
    await search.fill('browsereinstellung');
    await expect(options).toHaveText(['ブラウザの設定に従う（日本語）']);
    expect(await entryTexts()).toEqual(['ブラウザの設定に従う（日本語）']);
    expect(await textsAskedFor()).toEqual(['/github-pages/locales/de.json']);
  } finally {
    await browserLanguages?.dispose().catch(() => {});
    for (const script of initScripts) await script.dispose().catch(() => {});
    // The other cases have the requests for GitHub's installers cancelled again.
    await app.evaluate(() => { delete globalThis.__plmInstallerRedirect; }).catch(() => {});
    await website.close();
  }
});
