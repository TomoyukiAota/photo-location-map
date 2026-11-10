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
import { copyFile, mkdtemp, rm, stat } from 'node:fs/promises';
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
  if (build === 'checkout') {
    builds.push({ label, target: {} });
    continue;
  }
  // Resolved, so that a bundle is known by its name with a slash after it too.
  const resolved = path.resolve(build);
  const isFolder = await stat(resolved).then(found => found.isDirectory(), error => {
    if (error.code !== 'ENOENT') throw error;
    throw new Error(`--app ${entry}: there is nothing at ${resolved}. Give an executable, "checkout" or the folder of a checkout.`);
  });
  if (isFolder && resolved.endsWith('.app'))
    throw new Error(`--app ${entry}: give the executable inside the bundle, ${path.join(resolved, 'Contents/MacOS/<name>')}.`);
  builds.push({ label, target: isFolder ? { checkout: resolved } : { executable: resolved } });
}

/**
 * Fills the folder: copies of one JPEG of the fixtures, which has a thumbnail, a shooting time and a location.
 * Copied as clones where the file system can (APFS), which takes no space; elsewhere the copies are written out.
 */
async function fillFolder() {
  const photo = path.join(root, 'test/test-resources/actual-photos/Kobe/IMG_4676.JPG');
  for (let index = 1; index <= photoCount; index++)
    await copyFile(photo, path.join(folder, `IMG_${String(index).padStart(6, '0')}.JPG`), constants.COPYFILE_FICLONE);
}
/** The folder of photos, a temporary one, which is made and removed around the trials. */
let folder;

const viewers = '.photo-info-viewer-thumbnail-container';
const median = numbers => [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)];

/** One trial of a build: its figures, in milliseconds, megabytes and counts. */
async function measure(build) {
  const profile = await newProfile();
  const { app, page } = await launch({ target: build.target, profile });
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
    /** The time from now to the frame after the page has `count` viewers, which it has to have within 5 minutes. */
    const viewersShown = count => page.evaluate(([selector, count]) => new Promise((resolve, reject) => {
      const start = performance.now();
      const check = () => {
        const shown = document.querySelectorAll(selector).length;
        if (shown === count)
          requestAnimationFrame(() => resolve(Math.round(performance.now() - start)));
        else if (performance.now() - start > 300000)
          reject(new Error(`The page has ${shown} viewers after 5 minutes, not ${count}.`));
        else
          requestAnimationFrame(check);
      };
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
      checkboxMs.push(await checkbox.evaluate(input => new Promise((resolve, reject) => {
        const before = input.checked;
        const start = performance.now();
        const check = () => {
          if (input.checked !== before)
            requestAnimationFrame(() => resolve(Math.round(performance.now() - start)));
          else if (performance.now() - start > 60000)
            reject(new Error('The checkbox did not change within a minute of its click.'));
          else
            requestAnimationFrame(check);
        };
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
  folder = await mkdtemp(path.join(tmpdir(), 'plm-tree-rows-'));
  await fillFolder();
  for (let trial = 0; trial < trials; trial++) {
    // Each round runs the builds in the opposite order of the round before.
    for (const build of trial % 2 === 0 ? builds : [...builds].reverse()) {
      const figures = await measure(build);
      results[build.label].push(figures);
      console.log(JSON.stringify({ build: build.label, photos: photoCount, trial: trial + 1, ...figures }));
    }
  }
} finally {
  if (folder) await rm(folder, { recursive: true, force: true });
}

console.log(`\nMedians of ${trials} trials with ${photoCount} photos:`);
console.table(Object.fromEntries(Object.entries(results).map(([label, figures]) =>
  [label, Object.fromEntries(Object.keys(figures[0]).map(name => [name, median(figures.map(each => each[name]))]))])));
