// Launches the application under test on its own test profile and reads what it records. Works the same whether
// or not the renderer has Node.js: the page is read through the DOM and the User Timing marks of
// src-shared/perf/perf-mark.ts, and the main process through Playwright's evaluate.
import { _electron } from 'playwright';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * The archive of a packaged app's own code, as electron-builder makes it: app.asar in the folder of the app's
 * resources, which is the bundle's Contents/Resources on macOS, and resources beside the executable on Windows and
 * Linux.
 */
export function packagedAppArchive(executable, platform = process.platform) {
  return inPackagedResources(executable, platform, 'app.asar');
}

/**
 * The folder of a packaged app's own code, as electron-builder lays out a build without asar, as the builds before
 * docs/tasks/20261114_enable-asar/ are: app, in the same folder as app.asar.
 */
export function packagedAppRoot(executable, platform = process.platform) {
  return inPackagedResources(executable, platform, 'app');
}

/** `name` in the folder of the resources of the packaged app whose executable is `executable`. */
function inPackagedResources(executable, platform, name) {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const directory = paths.dirname(executable);
  return platform === 'darwin' ? paths.join(directory, '..', 'Resources', name) : paths.join(directory, 'resources', name);
}

/** A temporary profile, which removeProfile deletes. */
export async function newProfile() {
  return mkdtemp(path.join(tmpdir(), 'plm-perf-'));
}

export async function removeProfile(profile) {
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

/**
 * Launches `target` ({ executable } for a packaged app, { checkout } for the build of another checkout, with that
 * checkout's Electron, or {} for this checkout) on `profile`, with windows hidden, analytics and other external
 * requests cancelled, and Photo Data Viewer from `viewerServer`.
 * Returns { app, page, pid, spawnMs }, where spawnMs is the time just before the process was started, and pid is
 * the app's main process, whose are the launch report and the process tree. On Windows, Playwright starts the app
 * through a shell (cmd.exe), whose ID app.process() gives, so the main process is asked there; elsewhere the two are
 * the same, and the launch is not slowed by asking.
 */
export async function launch({ target, profile, viewerServer, env: extraEnv = {} }) {
  const env = { ...process.env, PLM_TEST_ROOT: profile, PLM_E2E: '1', PLM_TEST_HEADLESS: '1', PLM_TEST_OFFLINE: '1',
    ...(viewerServer ? { PLM_TEST_PHOTO_DATA_VIEWER_SERVER: viewerServer } : {}), ...(target.env ?? {}), ...extraEnv };
  for (const key of ['PLM_EM_MAIN', 'PLM_EM_RENDERER', 'ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS']) delete env[key];
  // A packaged app launched by a user has no npm development-profile setting.
  if (target.executable) delete env.npm_package_config_devOrProd;
  const spawnMs = Date.now();
  const app = await _electron.launch({
    executablePath: target.executable ?? (target.checkout ? createRequire(path.join(target.checkout, 'package.json'))('electron') : require('electron')),
    args: target.executable ? [] : ['test/e2e/main.cjs'],
    cwd: target.executable ? profile : target.checkout ?? root,
    env,
    timeout: 90000,
  });
  const page = await app.firstWindow();
  const pid = process.platform === 'win32' ? await app.evaluate(() => process.pid) : app.process().pid;
  return { app, page, pid, spawnMs };
}

const readMarks = () => performance.getEntriesByType('mark').filter(entry => entry.name.startsWith('plm:'))
  .map(entry => ({ name: entry.name, epochMs: performance.timeOrigin + entry.startTime, detail: entry.detail ?? null }));

/** The plm: marks of the page, as { name, epochMs, detail }. */
export function pageMarks(page) {
  return page.evaluate(readMarks);
}

/** The plm: marks of the main process, as { name, epochMs, detail }. */
export function mainMarks(app) {
  return app.evaluate(() => performance.getEntriesByType('mark').filter(entry => entry.name.startsWith('plm:'))
    .map(entry => ({ name: entry.name, epochMs: performance.timeOrigin + entry.startTime, detail: entry.detail ?? null })));
}

/** The time of the last mark `name` at or after `sinceMs`, or undefined. */
export function lastMark(marks, name, sinceMs = 0) {
  const found = marks.filter(mark => mark.name === `plm:${name}` && mark.epochMs >= sinceMs);
  return found.length ? found[found.length - 1] : undefined;
}

/** Waits until the page has a mark `name` at or after `sinceMs`, and returns it. */
export async function waitForPageMark(page, name, { sinceMs = 0, timeout = 120000 } = {}) {
  const handle = await page.waitForFunction(({ name, sinceMs }) => {
    const found = performance.getEntriesByName(`plm:${name}`, 'mark')
      .filter(entry => performance.timeOrigin + entry.startTime >= sinceMs);
    return found.length ? { epochMs: performance.timeOrigin + found[found.length - 1].startTime, detail: found[found.length - 1].detail ?? null } : false;
  }, { name, sinceMs }, { timeout, polling: 50 });
  return handle.jsonValue();
}

/** The launch is usable: its home view rendered. Returns the mark; when it does not render, says what the page had. */
export async function waitForUsable(page, timeout = 90000) {
  try {
    return await waitForPageMark(page, 'renderer:home-rendered', { timeout });
  } catch (error) {
    const bridge = await page.evaluate(() => !window.plm ? 'no bridge' : window.plm.startup === null
      ? 'the startup metadata refused' : 'a bridge').catch(() => 'unknown');
    throw new Error(`The home view did not render, with ${bridge}: ${error.message}`, { cause: error });
  }
}

/**
 * Clicks OK on the welcome dialog, which a profile shows until OK is clicked once. A build with several languages
 * shows its Language dialog before it, until a language is confirmed: OK there keeps the language that it offers,
 * English on a test profile.
 */
export async function dismissWelcome(page, { timeout = 15000 } = {}) {
  const languageDialog = page.locator('app-language-dialog');
  const dialog = page.locator('app-welcome-dialog');
  await languageDialog.or(dialog).first().waitFor({ timeout });
  if (await languageDialog.count() > 0) {
    await languageDialog.locator('.ok-button').click();
    await languageDialog.waitFor({ state: 'detached', timeout });
  }
  await dialog.waitFor({ timeout });
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await dialog.waitFor({ state: 'detached', timeout });
}

/** Makes the folder picker of the main process choose `folder`. */
export function stubFolderPicker(app, folder) {
  return app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, folder);
}

/** The memory of each process that Electron reports, in kilobytes, with its type. */
export function appMetrics(app) {
  return app.evaluate(({ app }) => app.getAppMetrics().map(metric => ({ pid: metric.pid, type: metric.type,
    workingSetKb: metric.memory.workingSetSize, peakWorkingSetKb: metric.memory.peakWorkingSetSize ?? null,
    privateKb: metric.memory.privateBytes ?? null })));
}

/** Closes the application, or kills it if it does not quit within `timeoutMs`. Returns how long it took. */
export async function close(app, timeoutMs = 15000) {
  let child;
  try {
    child = app.process();
  } catch {
    return 0; // Already closed: the application quit on its own, as it does to restart.
  }
  const startMs = Date.now();
  let timer;
  try {
    if (child.exitCode === null && child.signalCode === null) {
      await Promise.race([app.close(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('did not quit in time')), timeoutMs); })]);
    }
  } catch {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGKILL');
      await exited;
    }
  } finally {
    clearTimeout(timer);
  }
  // Playwright can report the application closed while its process still runs, as after a failed step with a
  // window still loading. The trial is over either way: the next one must not share the computer with it.
  if (child.pid && alive(child.pid)) {
    child.kill('SIGKILL');
    await waitUntil(() => !alive(child.pid), 10000);
  }
  return Date.now() - startMs;
}

/** Whether a process with `pid` runs. */
export function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Polls `predicate` until it returns a truthy value, which it returns, or until `timeoutMs`, then undefined. */
export async function waitUntil(predicate, timeoutMs, intervalMs = 20) {
  const startMs = Date.now();
  for (;;) {
    const value = await predicate();
    if (value) return value;
    if (Date.now() - startMs > timeoutMs) return undefined;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

/**
 * Starts recording, in the page, its long tasks and the gaps between animation frames, and, in the main process, the
 * delays of its event loop. stop() returns them, for the time since start.
 */
export async function startResponsivenessProbes(app, page) {
  await page.evaluate(() => {
    const probe = { longtasks: [], maxFrameGapMs: 0, frames: 0, stopped: false };
    window.__plmPerfProbe = probe;
    probe.observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) probe.longtasks.push({ startMs: performance.timeOrigin + entry.startTime, durationMs: entry.duration });
    });
    probe.observer.observe({ type: 'longtask' });
    let last = performance.now();
    /** Counts each animation frame and keeps the longest gap between two. */
    const frame = now => {
      probe.maxFrameGapMs = Math.max(probe.maxFrameGapMs, now - last);
      probe.frames++;
      last = now;
      if (!probe.stopped) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await app.evaluate(() => {
    const { monitorEventLoopDelay } = globalThis.__plmTestRequire('node:perf_hooks');
    globalThis.__plmPerfEventLoop = monitorEventLoopDelay({ resolution: 10 });
    globalThis.__plmPerfEventLoop.enable();
  });
  return {
    async stop() {
      const renderer = await page.evaluate(() => {
        const probe = window.__plmPerfProbe;
        probe.stopped = true;
        probe.observer.disconnect();
        return { longtasks: probe.longtasks, maxFrameGapMs: probe.maxFrameGapMs, frames: probe.frames };
      });
      const main = await app.evaluate(() => {
        const histogram = globalThis.__plmPerfEventLoop;
        histogram.disable();
        const ms = ns => ns / 1e6;
        return { maxMs: ms(histogram.max), p99Ms: ms(histogram.percentile(99)), meanMs: ms(histogram.mean) };
      });
      return { renderer, main };
    },
  };
}
