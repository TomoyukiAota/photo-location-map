// The measured scenarios. Each returns { metrics, details }: metrics are numbers (milliseconds for -ms, kilobytes
// for -kb, counts otherwise) that summarize.mjs compares; details keep what a reader needs to check them.
// Every time comes from the epoch clock of this computer, which the harness and the application's processes share.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { alive, appMetrics, close, dismissWelcome, lastMark, launch, mainMarks, newProfile, pageMarks, removeProfile,
  startResponsivenessProbes, stubFolderPicker, waitForPageMark, waitForUsable, waitUntil as waitFor } from './app.mjs';
import { startTreeSampler, treeSnapshot } from './memory.mjs';

const prefix = (name, metrics) => Object.fromEntries(Object.entries(metrics).map(([key, value]) => [`${name}.${key}`, value]));
const at = (marks, name, sinceMs) => lastMark(marks, name, sinceMs)?.epochMs;

/** The pid of the renderer of the window of `page`. */
async function rendererPid(app, page) {
  const window = await app.browserWindow(page);
  return window.evaluate(window => window.webContents.getOSProcessId());
}

async function memoryNow(app, pid, renderer) {
  const [tree, electron] = await Promise.all([treeSnapshot(pid), appMetrics(app)]);
  return {
    treeRssKb: tree.totalRssKb,
    mainWorkingSetKb: electron.filter(metric => metric.type === 'Browser').reduce((sum, metric) => sum + metric.workingSetKb, 0),
    rendererWorkingSetKb: electron.find(metric => metric.pid === renderer)?.workingSetKb ?? null,
    tree, electron,
  };
}

async function measureLaunch(context, profile, { welcome }) {
  const { app, page, pid, spawnMs } = await launch({ target: context.target, profile, viewerServer: context.viewerServer });
  try {
    const usable = await waitForUsable(page);
    const [main, renderer, mainOrigin, pageOrigin] = await Promise.all([mainMarks(app), pageMarks(page),
      app.evaluate(() => performance.timeOrigin), page.evaluate(() => performance.timeOrigin)]);
    const metrics = {
      'process-started-ms': mainOrigin - spawnMs,
      'create-window-ms': at(main, 'main:create-window') - spawnMs,
      'window-created-ms': at(main, 'main:window-created') - spawnMs,
      'navigation-start-ms': pageOrigin - spawnMs,
      'bootstrap-start-ms': at(renderer, 'renderer:bootstrap-start') - spawnMs,
      'bootstrap-done-ms': at(renderer, 'renderer:bootstrap-done') - spawnMs,
      'did-finish-load-ms': at(main, 'main:did-finish-load') - spawnMs,
      'ready-to-show-ms': at(main, 'main:ready-to-show') - spawnMs,
      'home-rendered-ms': usable.epochMs - spawnMs,
      // From the page's navigation to the app's bootstrap (src/main.ts until stage C1 of the remote removal,
      // src/start-app.ts since): loading and evaluating the application's modules, with what they read from the main
      // process while they are evaluated.
      'renderer-modules-ms': at(renderer, 'renderer:bootstrap-start') - pageOrigin,
      'renderer-bootstrap-ms': at(renderer, 'renderer:bootstrap-done') - at(renderer, 'renderer:bootstrap-start'),
    };
    if (welcome) await dismissWelcome(page);
    await page.waitForTimeout(context.settleMs);
    const memory = await memoryNow(app, pid, await rendererPid(app, page));
    metrics['settled-tree-rss-kb'] = memory.treeRssKb;
    metrics['settled-main-ws-kb'] = memory.mainWorkingSetKb;
    metrics['settled-renderer-ws-kb'] = memory.rendererWorkingSetKb;
    metrics['close-ms'] = await close(app);
    return { metrics, details: { mainMarks: main, rendererMarks: renderer, memory } };
  } catch (error) {
    await close(app);
    throw error;
  }
}

/** A launch on a new profile, which shows the welcome dialog, then a launch on the same profile. */
export async function startup(context) {
  const profile = await newProfile();
  try {
    const cold = await measureLaunch(context, profile, { welcome: true });
    const warm = await measureLaunch(context, profile, { welcome: false });
    return { metrics: { ...prefix('cold', cold.metrics), ...prefix('warm', warm.metrics) }, details: { cold: cold.details, warm: warm.details } };
  } finally {
    await removeProfile(profile);
  }
}

async function measureOpen(context, app, page, pid, renderer, { first, thumbnails }) {
  const sampler = startTreeSampler(pid);
  try {
    return await measureOpenWith(context, app, page, pid, renderer, { first, thumbnails }, sampler);
  } finally {
    await sampler.stop();
  }
}

async function measureOpenWith(context, app, page, pid, renderer, { first, thumbnails }, sampler) {
  const probes = await startResponsivenessProbes(app, page);
  const before = await treeSnapshot(pid);
  const clickMs = Date.now();
  const markers = first ? page.waitForFunction(() => (document.querySelector('.plm-leaflet-map-div-icon, .marker-cluster')
    ? performance.timeOrigin + performance.now() : false), null, { polling: 'raf', timeout: 300000 }) : null;
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  const complete = await waitForPageMark(page, 'open-folder:complete', { sinceMs: clickMs, timeout: 300000 });
  const markersMs = markers ? await (await markers).jsonValue() : undefined;
  // Long tasks and frame gaps until the first frames after the photos are shown, which their rendering takes.
  await page.waitForTimeout(500);
  const responsiveness = await probes.stop();
  const thumbnailsDone = thumbnails ? await waitForPageMark(page, 'thumbnails:status-done', { sinceMs: clickMs, timeout: 300000 }) : undefined;
  const peak = await sampler.stop();
  await page.waitForTimeout(context.settleMs);
  const settled = await memoryNow(app, pid, renderer);
  const [rendererMarks, main] = await Promise.all([pageMarks(page), mainMarks(app)]);
  const mark = name => at(rendererMarks, name, clickMs);
  const start = mark('open-folder:start');
  const exif = lastMark(rendererMarks, 'exif:all-done', clickMs)?.detail ?? {};
  const longtasks = responsiveness.renderer.longtasks.filter(task => task.startMs >= clickMs);
  const metrics = {
    'click-to-dialog-ms': mark('open-folder:dialog-requested') - clickMs,
    'dialog-ms': mark('open-folder:dialog-returned') - mark('open-folder:dialog-requested'),
    'dialog-to-start-ms': start - mark('open-folder:dialog-returned'),
    'directory-tree-ms': mark('open-folder:tree-created') - start,
    'photo-data-ms': mark('open-folder:photo-data-loaded') - mark('open-folder:tree-created'),
    'finish-ms': complete.epochMs - mark('open-folder:photo-data-loaded'),
    'start-to-complete-ms': complete.epochMs - start,
    'click-to-complete-ms': complete.epochMs - clickMs,
    'exif-files': exif.files,
    'exif-parse-sum-ms': exif.parseMs,
    'exif-thumbnail-sum-ms': exif.thumbnailMs,
    // From stage A on, the renderer's one request per photo, which compares with the two sums above before stage A.
    'exif-read-sum-ms': exif.readMs ?? 0,
    'exif-rotate-sum-ms': exif.rotateMs,
    'exif-max-file-ms': exif.maxFileMs,
    'renderer-longtasks': longtasks.length,
    'renderer-longtask-total-ms': longtasks.reduce((sum, task) => sum + task.durationMs, 0),
    'renderer-longtask-max-ms': longtasks.reduce((max, task) => Math.max(max, task.durationMs), 0),
    'renderer-max-frame-gap-ms': responsiveness.renderer.maxFrameGapMs,
    'main-event-loop-max-ms': responsiveness.main.maxMs,
    'main-event-loop-p99-ms': responsiveness.main.p99Ms,
    'peak-tree-rss-kb': peak.peakTotalRssKb,
    'peak-tree-delta-kb': peak.peakTotalRssKb - before.totalRssKb,
    'settled-tree-rss-kb': settled.treeRssKb,
    'settled-renderer-ws-kb': settled.rendererWorkingSetKb,
    'settled-main-ws-kb': settled.mainWorkingSetKb,
  };
  if (markersMs) metrics['start-to-markers-ms'] = markersMs - start;
  if (thumbnailsDone) {
    metrics['start-to-thumbnails-done-ms'] = thumbnailsDone.epochMs - start;
    metrics['thumbnails-main-ms'] = at(main, 'thumbnails:main-finished', clickMs) - at(main, 'thumbnails:main-started', clickMs);
  }
  return { metrics, details: { rendererMarks: rendererMarks.filter(m => m.epochMs >= clickMs), mainMarks: main.filter(m => m.epochMs >= clickMs),
    longtasks, peak, settled } };
}

/** Opens the large folder on a new profile, with its HEIC thumbnails made, then opens it again, with them cached. */
export async function openFolder(context) {
  const profile = await newProfile();
  const { app, page, pid } = await launch({ target: context.target, profile, viewerServer: context.viewerServer });
  try {
    await waitForUsable(page);
    await dismissWelcome(page);
    await page.waitForTimeout(context.settleMs);
    const renderer = await rendererPid(app, page);
    await stubFolderPicker(app, context.workloads.large.directory);
    const cold = await measureOpen(context, app, page, pid, renderer, { first: true, thumbnails: true });
    const warm = await measureOpen(context, app, page, pid, renderer, { first: false, thumbnails: false });
    return { metrics: { ...prefix('cold', cold.metrics), ...prefix('warm', warm.metrics) }, details: { cold: cold.details, warm: warm.details } };
  } finally {
    await close(app);
    await removeProfile(profile);
  }
}

async function openOnlyPhoto(page, app, folder) {
  await stubFolderPicker(app, folder);
  const clickMs = Date.now();
  await page.getByRole('button', { name: 'Open Folder', exact: true }).click();
  await waitForPageMark(page, 'open-folder:complete', { sinceMs: clickMs });
  const marker = page.locator('.plm-leaflet-map-div-icon').first();
  await marker.waitFor();
  // A click event on the marker itself, as a marker can lie under the edge of the map.
  await marker.dispatchEvent('click');
  await page.locator('.leaflet-popup .photo-info-viewer-more-options-button').click();
  const item = page.locator('.photo-info-viewer-more-options-menu-item').filter({ hasText: 'View Data' });
  await item.waitFor();
  return item;
}

async function measureViewData(context, app, page, pid, renderer, item, fileName) {
  // The photo itself, not the viewer's placeholder while it converts a HEIC: an object URL of the file, under its name.
  const before = await treeSnapshot(pid);
  const sampler = startTreeSampler(pid);
  try {
    return await measureViewer(context, app, page, pid, renderer, item, fileName, before, sampler);
  } finally {
    await sampler.stop();
  }
}

async function measureViewer(context, app, page, pid, renderer, item, fileName, before, sampler) {
  const windowEvent = app.waitForEvent('window', { timeout: 60000 });
  // TL;DR: Handled at once, so that a failure before it is awaited fails the trial, not the whole series.
  // Details: When the click threw, the app was closed while this waited, and its rejection, unhandled, ended run.mjs
  // in the first attempt of series rer-2-C1. Awaited below as before; the measurement is unchanged.
  windowEvent.catch(() => {});
  const menuMs = Date.now();
  await item.click();
  const viewer = await windowEvent;
  const imageMs = await (await viewer.waitForFunction(name => ([...document.querySelectorAll('img')]
    .some(img => img.alt === name && img.src.startsWith('blob:') && img.complete && img.naturalWidth > 0)
    ? performance.timeOrigin + performance.now() : false), fileName, { polling: 'raf', timeout: 60000 })).jsonValue();
  const metadataMs = await (await viewer.waitForFunction(name => ((document.body?.innerText.includes('Date Taken') && document.body.innerText.includes(name))
    ? performance.timeOrigin + performance.now() : false), fileName, { polling: 'raf', timeout: 60000 })).jsonValue();
  await viewer.waitForTimeout(context.settleMs);
  const peak = await sampler.stop();
  const open = await memoryNow(app, pid, renderer);
  const [rendererMarks, main, navigation] = await Promise.all([pageMarks(page), mainMarks(app),
    viewer.evaluate(() => performance.getEntriesByType('navigation')[0]?.toJSON() ?? null)]);
  const requested = at(rendererMarks, 'view-data:requested', menuMs);
  const launched = at(main, 'view-data:launch', menuMs);
  const metrics = {
    'menu-to-request-ms': requested - menuMs,
    'request-to-launch-ms': launched - requested,
    'launch-to-window-created-ms': at(main, 'view-data:window-created', menuMs) - launched,
    'window-created-to-page-loaded-ms': at(main, 'view-data:page-loaded', menuMs) - at(main, 'view-data:window-created', menuMs),
    'request-to-page-loaded-ms': at(main, 'view-data:page-loaded', menuMs) - requested,
    'request-to-image-ms': imageMs - requested,
    'request-to-metadata-ms': metadataMs - requested,
    'peak-tree-delta-kb': peak.peakTotalRssKb - before.totalRssKb,
    'open-tree-delta-kb': open.treeRssKb - before.totalRssKb,
  };
  const closeWindow = app.evaluate(({ BrowserWindow }) => new Promise(resolve => {
    const viewers = BrowserWindow.getAllWindows().filter(window => window.getTitle().endsWith(' - Photo Location Map'));
    let left = viewers.length;
    if (!left) resolve();
    for (const window of viewers) { window.once('closed', () => { if (--left === 0) resolve(); }); window.close(); }
  }));
  await closeWindow;
  await page.waitForTimeout(context.settleMs);
  const after = await treeSnapshot(pid);
  metrics['after-close-tree-delta-kb'] = after.totalRssKb - before.totalRssKb;
  return { metrics, details: { navigation, before, peak, open, after } };
}

/**
 * Opens a JPEG in Photo Data Viewer from its marker's popup, first with the viewer's page not yet in the HTTP cache of
 * the profile, then again, then a HEIC, then the HEIC three more times.
 */
export async function viewData(context) {
  const profile = await newProfile();
  const { app, page, pid } = await launch({ target: context.target, profile, viewerServer: context.viewerServer });
  try {
    await waitForUsable(page);
    // The viewer shows the photo beside its data only when its window is wider than 1200 pixels; narrower, the photo
    // is on a tab of its own. The window opens with the size it last had, saved in the profile.
    const userData = await app.evaluate(({ app }) => app.getPath('userData'));
    for (const [key, value] of Object.entries({ WindowX: 40, WindowY: 40, WindowWidth: 1400, WindowHeight: 900 })) {
      const directory = path.join(userData, 'PhotoLocationMapStorage', 'PhotoDataViewer');
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, `${key}.json`), JSON.stringify({ [key]: String(value) }));
    }
    await dismissWelcome(page);
    await page.waitForTimeout(context.settleMs);
    const renderer = await rendererPid(app, page);
    const results = {};
    for (const [kind, workload] of [['jpeg-first', context.workloads.viewJpeg], ['jpeg', context.workloads.viewJpeg], ['heic', context.workloads.viewHeic]]) {
      const item = await openOnlyPhoto(page, app, workload.directory);
      results[kind] = await measureViewData(context, app, page, pid, renderer, item, path.basename(workload.entries[0].path));
    }
    // Memory that opening and closing the viewer leaves behind.
    const before = await treeSnapshot(pid);
    for (let cycle = 0; cycle < 3; cycle++) {
      const item = await openOnlyPhoto(page, app, context.workloads.viewHeic.directory);
      await measureViewData(context, app, page, pid, renderer, item, path.basename(context.workloads.viewHeic.entries[0].path));
    }
    const after = await treeSnapshot(pid);
    return {
      metrics: { ...prefix('jpeg-first', results['jpeg-first'].metrics), ...prefix('jpeg', results.jpeg.metrics), ...prefix('heic', results.heic.metrics),
        'cycles.retained-tree-kb': after.totalRssKb - before.totalRssKb },
      details: { 'jpeg-first': results['jpeg-first'].details, jpeg: results.jpeg.details, heic: results.heic.details, cycles: { before, after } },
    };
  } finally {
    await close(app);
    await removeProfile(profile);
  }
}

async function readSetting(userData, name) {
  try {
    return JSON.parse(await readFile(path.join(userData, 'PhotoLocationMapStorage', 'UserSettings', `${name}.json`), 'utf8'))[name];
  } catch {
    return undefined;
  }
}


async function openSettings(page) {
  await page.evaluate(() => window.plmInternalRenderer.settingsDialog.showSettingsDialog());
  await page.locator('app-settings-dialog').waitFor();
}

/**
 * Saves a setting that applies at once, then a new date format, which the application restarts for: from the
 * click on Save until the relaunched application's home view renders, as the launch report of the test hooks tells.
 */
export async function settings(context) {
  const profile = await newProfile();
  const report = path.join(profile, 'launches.jsonl');
  const { app, page, pid } = await launch({ target: context.target, profile, viewerServer: context.viewerServer,
    env: { PLM_TEST_LAUNCH_REPORT: report } });
  let relaunchedPid;
  try {
    await waitForUsable(page);
    await dismissWelcome(page);
    await page.waitForTimeout(context.settleMs);
    const userData = await app.evaluate(({ app }) => app.getPath('userData'));

    await openSettings(page);
    const checkbox = page.getByRole('checkbox', { name: 'Show Status Bar' });
    const shown = await checkbox.isChecked();
    await checkbox.setChecked(!shown);
    // Timed in the page, at each frame: a wait of Playwright's own polls at intervals that grow to 100 ms and more,
    // which turned a few milliseconds' change into 100 (protocol rer-1's baseline).
    const closed = page.waitForFunction(() => (document.querySelector('app-settings-dialog') ? false : performance.timeOrigin + performance.now()),
      null, { polling: 'raf', timeout: 30000 });
    const saveMs = Date.now();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const closedMs = await (await closed).jsonValue();
    const persistedMs = await waitFor(async () => (await readSetting(userData, 'ShowStatusBar')) === String(!shown) && Date.now(), 5000);
    if (!persistedMs) throw new Error('Show Status Bar was not saved.');

    await openSettings(page);
    await page.locator('app-settings-dialog mat-list-item').filter({ hasText: 'Date & Time' }).click();
    await page.getByRole('combobox', { name: 'Date Format' }).click();
    await page.getByRole('option', { name: 'DD/MM/YYYY', exact: true }).click();
    await page.getByRole('listbox').waitFor({ state: 'detached' });
    await page.evaluate(() => { window.confirm = () => true; });
    const child = app.process();
    const exited = new Promise(resolve => child.once('exit', () => resolve(Date.now())));
    const restartMs = Date.now();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    const exitMs = await Promise.race([exited, new Promise(resolve => setTimeout(() => resolve(undefined), 30000))]);
    if (!exitMs) throw new Error('The application did not quit to restart.');
    const relaunched = await waitFor(async () => {
      const lines = (await readFile(report, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(line => JSON.parse(line));
      return lines.find(line => line.pid !== pid);
    }, 90000, 50);
    if (!relaunched) throw new Error('The relaunched application did not report its launch.');
    relaunchedPid = relaunched.pid;
    const usableMs = relaunched.rendererMarks.find(mark => mark.name === 'plm:renderer:home-rendered').epochMs;
    if ((await readSetting(userData, 'DateFormat')) !== 'DD/MM/YYYY') throw new Error('The date format was not saved before the restart.');
    return {
      metrics: {
        'save.click-to-closed-ms': closedMs - saveMs,
        'save.click-to-persisted-ms': persistedMs - saveMs,
        'restart.click-to-exit-ms': exitMs - restartMs,
        'restart.click-to-process-started-ms': relaunched.timeOriginMs - restartMs,
        'restart.click-to-home-rendered-ms': usableMs - restartMs,
        'restart.process-to-home-rendered-ms': usableMs - relaunched.timeOriginMs,
      },
      details: { relaunched },
    };
  } finally {
    await close(app);
    if (relaunchedPid && alive(relaunchedPid)) {
      process.kill(relaunchedPid, 'SIGTERM');
      if (!(await waitFor(() => !alive(relaunchedPid), 15000, 100))) process.kill(relaunchedPid, 'SIGKILL');
    }
    await removeProfile(profile);
  }
}

export const scenarios = { startup, 'open-folder': openFolder, 'view-data': viewData, settings };
