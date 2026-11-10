// Measures what the rows of the folder tree cost with the viewers of their photos. A folder that has its photos in
// it has a row, and so a viewer (src/app/photo-info-viewer/), for each photo as soon as it is opened: the time to
// open it, the time to make its rows again and the page's memory tell what a change to the viewer costs.
// See test/performance/README.md.
//
//   node test/performance/tree-rows.mjs --app <label>=<build> [--app <label>=<build> ...] [--photos 2000] [--trials 3]
//
// <build> is a packaged app's executable, "checkout" for this checkout's build (dist/ and src-main/), or the folder
// of another checkout with its own build and node_modules, such as a git worktree of the commit before a change.
// Prints one JSON line for each trial, then the median of each figure for each build.
import { constants } from 'node:fs';
import { copyFile, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { close, dismissWelcome, launch, newProfile, removeProfile, root, stubFolderPicker, waitForUsable } from './lib/app.mjs';

const { values } = parseArgs({ options: {
  app: { type: 'string', multiple: true },
  photos: { type: 'string', default: '2000' },
  trials: { type: 'string', default: '3' },
} });
if (!values.app?.length) throw new Error('Give at least one --app <label>=<build>.');
const photoCount = Number(values.photos);
const trials = Number(values.trials);
if (!Number.isInteger(photoCount) || photoCount < 1) throw new Error(`--photos must be a whole number of at least 1, not ${values.photos}.`);
if (!Number.isInteger(trials) || trials < 1) throw new Error(`--trials must be a whole number of at least 1, not ${values.trials}.`);

const builds = [];
for (const entry of values.app) {
  const [label, ...rest] = entry.split('=');
  const build = rest.join('=');
  if (build === 'checkout') builds.push({ label, target: {} });
  else if ((await stat(build)).isDirectory() && !build.endsWith('.app')) builds.push({ label, checkout: path.resolve(build) });
  else builds.push({ label, target: { executable: build } });
}

/** Launches the build of another checkout, as lib/app.mjs launches this checkout's, with that checkout's Electron. */
async function launchCheckout(checkout, profile) {
  const require = createRequire(path.join(checkout, 'package.json'));
  const { _electron } = require('playwright');
  const env = { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: '1', PLM_TEST_OFFLINE: '1' };
  for (const key of ['PLM_EM_MAIN', 'PLM_EM_RENDERER', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS']) delete env[key];
  const app = await _electron.launch({ executablePath: require('electron'), args: ['test/e2e/main.cjs'], cwd: checkout, env, timeout: 90000 });
  return { app, page: await app.firstWindow() };
}

// The folder: copies of one JPEG of the fixtures, which has a thumbnail, a shooting time and a location. Copied as
// clones where the file system can (APFS), which takes no space; elsewhere the copies are written out.
const folder = await mkdtemp(path.join(tmpdir(), 'plm-tree-rows-'));
const photo = path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG');
await mkdir(folder, { recursive: true });
for (let index = 1; index <= photoCount; index++)
  await copyFile(photo, path.join(folder, `IMG_${String(index).padStart(6, '0')}.JPG`), constants.COPYFILE_FICLONE);

const viewers = '.photo-info-viewer-thumbnail-container';
const median = numbers => [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)];

/** One trial of a build: its figures, in milliseconds, megabytes and counts. */
async function measure(build) {
  const profile = await newProfile();
  const { app, page } = build.checkout ? await launchCheckout(build.checkout, profile) : await launch({ target: build.target, profile });
  try {
    await waitForUsable(page);
    await dismissWelcome(page);
    const session = await page.context().newCDPSession(page);
    await session.send('Performance.enable');
    /** The page's memory after a garbage collection, and what Electron reports for the page's process. */
    const memory = async () => {
      for (let turn = 0; turn < 3; turn++) {
        await session.send('HeapProfiler.collectGarbage');
        await page.waitForTimeout(300);
      }
      const { metrics } = await session.send('Performance.getMetrics');
      const metric = name => metrics.find(each => each.name === name)?.value;
      const window = await app.browserWindow(page);
      const pid = await window.evaluate(window => window.webContents.getOSProcessId());
      const workingSetKb = await app.evaluate(({ app }, pid) => app.getAppMetrics().find(each => each.pid === pid)?.memory.workingSetSize, pid);
      return { heapMb: Math.round(metric('JSHeapUsedSize') / 1048576 * 10) / 10, nodes: metric('Nodes'), listeners: metric('JSEventListeners'),
        processMb: Math.round(workingSetKb / 1024) };
    };
    /** The time from now to the frame after the page has `count` viewers. */
    const viewersShown = count => page.evaluate(([selector, count]) => new Promise(resolve => {
      const start = performance.now();
      const check = () => requestAnimationFrame(document.querySelectorAll(selector).length === count
        ? () => resolve(Math.round(performance.now() - start)) : check);
      check();
    }), [viewers, count]);

    await stubFolderPicker(app, folder);
    let shown = viewersShown(photoCount);
    await page.locator('.open-folder-button button').click();
    const openMs = await shown;
    await page.locator('app-loading-folder-dialog').waitFor({ state: 'detached', timeout: 300000 });
    await page.waitForTimeout(4000);
    const afterOpen = await memory();

    // The rows made again: the folder collapsed, then expanded.
    const toggle = page.locator('mat-tree-node').first().locator('button[mattreenodetoggle]');
    const rowsAgainMs = [];
    for (let turn = 0; turn < 3; turn++) {
      shown = viewersShown(0);
      await toggle.click();
      await shown;
      await page.waitForTimeout(500);
      shown = viewersShown(photoCount);
      await toggle.click();
      rowsAgainMs.push(await shown);
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(3000);
    const afterRowsAgain = await memory();

    // A click that changes one row, to the frame after the change is shown: what every other row costs then.
    const checkbox = page.locator('mat-tree-node').nth(5).locator('input[type="checkbox"]');
    const checkboxMs = [];
    for (let turn = 0; turn < 6; turn++) {
      checkboxMs.push(await checkbox.evaluate(input => new Promise(resolve => {
        const before = input.checked;
        const start = performance.now();
        const check = () => requestAnimationFrame(input.checked !== before ? () => resolve(Math.round(performance.now() - start)) : check);
        input.click();
        check();
      })));
      await page.waitForTimeout(1500);
    }
    return { openMs, rowsAgainMs: median(rowsAgainMs), checkboxMs: median(checkboxMs), heapMb: afterOpen.heapMb, nodes: afterOpen.nodes,
      listeners: afterOpen.listeners, processMb: afterOpen.processMb, heapAfterRowsAgainMb: afterRowsAgain.heapMb };
  } finally {
    await close(app);
    await removeProfile(profile);
  }
}

const results = Object.fromEntries(builds.map(build => [build.label, []]));
try {
  for (let trial = 0; trial < trials; trial++) {
    // Each round runs the builds in the opposite order of the round before.
    for (const build of trial % 2 === 0 ? builds : [...builds].reverse()) {
      const figures = await measure(build);
      results[build.label].push(figures);
      console.log(JSON.stringify({ build: build.label, photos: photoCount, trial: trial + 1, ...figures }));
    }
  }
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log(`\nMedians of ${trials} trials with ${photoCount} photos:`);
console.table(Object.fromEntries(Object.entries(results).map(([label, figures]) =>
  [label, Object.fromEntries(Object.keys(figures[0]).map(name => [name, median(figures.map(each => each[name]))]))])));
