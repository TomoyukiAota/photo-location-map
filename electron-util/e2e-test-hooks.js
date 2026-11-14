// Fixed test support shared by checkout and packaged launches. No external code
// is loaded from environment variables, and ordinary launches do not enter here.
import { app, BrowserWindow, session } from 'electron';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import zlib from 'node:zlib';
import { photoDataViewerServerOverride as serverOverrideOf } from './photo-data-viewer-server-override.js';

const testRoot = process.env.PLM_TEST_ROOT;
const automated = process.env.PLM_E2E === '1';

if (automated && (!testRoot || !path.isAbsolute(testRoot))) {
  throw new Error('PLM_E2E requires an absolute PLM_TEST_ROOT.');
}

// TL;DR: Test runners set PLM_TEST_HEADLESS=1 to keep every window off the screen, so that a
// test run does not take over the screen of the developer working on the same machine.
// Pass the options of every BrowserWindow through withHeadlessTestOptions. The windows are
// hidden, except on Windows: a hidden window there gets about one animation frame per second,
// so it is shown instead, but fully transparent, click-through and never activated.
// Details:
// - Electron has no headless mode. A window created with show: false is never put on screen,
//   and the app is never brought to the front. backgroundThrottling: false keeps such a window
//   painting: https://www.electronjs.org/docs/latest/api/structures/web-preferences On macOS
//   it then behaves as a shown one does. On Linux, a hidden window is as slow as on Windows,
//   and the transparent one below too, so the e2e suite shows the windows there
//   (see test/e2e/regression.spec.mjs).
// - On Windows (Electron 45.2.1), the page of a hidden window got 143.5 animation frames per
//   second on a 144 Hz display while nothing on it changed, but 1.3 once it changed every
//   frame, with or without hardware acceleration. Its frames reach no display, and Chromium
//   sends at most one frame per second to a page that has more than three frames not drawn
//   (kUndrawnFrameLimit in components/viz/service/frame_sinks/compositor_frame_sink_support.cc).
//   That made the e2e suite take 3.7 minutes instead of 1.6 on Windows CI (#636).
// - A window shown with opacity 0, which Windows makes a layered window with alpha 0 and does
//   not draw, with showInactive() and setIgnoreMouseEvents(true), got 144 frames per second.
//   type: 'toolbar' (WS_EX_TOOLWINDOW) keeps it out of the taskbar and Alt+Tab, and
//   focusable: false (WS_EX_NOACTIVATE) keeps Windows from activating it when the developer
//   closes or minimizes the active window. While the e2e suite ran, a monitor read the windows
//   every 60 ms: none was ever on screen or active.
// - --disable-backgrounding-occluded-windows: when other windows covered such a window from
//   its first frame, its page got no animation frame at all in 4 of 20 runs, and in none of 24
//   with the switch. Chromium shows a page only once its window is first visible, and the
//   switch counts an occluded window as visible (WebContentsImpl::UpdateWebContentsVisibility).
//   Playwright gives the same switch to its own browsers. It is appended here rather than
//   passed on the command line, so that the app's own options in process.argv are unchanged.
// - Rejected: on a hidden window, Playwright's other switches (--disable-renderer-backgrounding,
//   --disable-background-timer-throttling) and --disable-features=CalculateNativeWinOcclusion
//   left 1.3 frames per second, since the window is hidden rather than occluded or in the
//   background; --disable-frame-rate-limit gave about 4,000, unpaced. Offscreen rendering
//   (webPreferences.offscreen) gave 60, but renders differently from the app as shipped.
const headless = !!testRoot && process.env.PLM_TEST_HEADLESS === '1';
const transparent = headless && process.platform === 'win32';
export const isHeadlessTest = headless;
export const withHeadlessTestOptions = options => headless ? {
  ...options, show: false, ...(transparent ? { opacity: 0, type: 'toolbar', focusable: false } : {}),
  webPreferences: { ...options.webPreferences, backgroundThrottling: false },
} : options;

// A test can serve Photo Data Viewer from a local build (see photo-data-viewer-server-override.js).
export const photoDataViewerServerOverride = serverOverrideOf(process.env);

if (testRoot) {
  if (transparent) {
    app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
    // Show each window that withHeadlessTestOptions created. Electron emits this event before the
    // window takes its options, so wait until the constructor has made the window transparent.
    app.on('browser-window-created', (_event, window) => setImmediate(() => {
      if (window.isDestroyed() || window.isVisible() || window.getOpacity() !== 0) return;
      window.setIgnoreMouseEvents(true);
      window.showInactive();
    }));
  }
  if (automated) {
    // Preserve Electron/Commander argument conventions and ordinary CLI options.
    // These exact flags are added by Playwright, including its Linux default.
    const debuggingFlags = new Set(['--inspect=0', '--remote-debugging-port=0', '--no-sandbox']);
    process.argv = process.argv.filter((arg, index) => index === 0 || !debuggingFlags.has(arg));
    // The e2e suite and the performance harness load modules in the main process with this: Node's, Electron's, and
    // the app's, which are ES modules that require() loads as well, as none awaits at its top.
    globalThis.__plmTestRequire = createRequire(import.meta.url);
    // Record the calls that would show a hidden window by restoring a maximized or full-screen
    // state, for the e2e suite to check that none is made: on macOS, a window becomes full screen
    // only after a transition, which can still be under way when the suite looks at it.
    globalThis.__plmWindowStateCalls = [];
    for (const name of ['maximize', 'setFullScreen']) {
      const original = BrowserWindow.prototype[name];
      BrowserWindow.prototype[name] = function (...args) {
        globalThis.__plmWindowStateCalls.push([name, ...args]);
        return original.apply(this, args);
      };
    }
  }

  function captureAnalytics(details) {
    const service = details.url.includes('amplitude.com') ? 'amplitude'
      : details.url.includes('mixpanel.com') ? 'mixpanel' : undefined;
    if (!service || !details.uploadData) return;
    try {
      let body = Buffer.concat(details.uploadData.filter(part => part.bytes).map(part => part.bytes));
      if (body[0] === 0x1f && body[1] === 0x8b) body = zlib.gunzipSync(body);
      let text = body.toString('utf8');
      if (service === 'mixpanel' && !text.startsWith('[') && !text.startsWith('{')) {
        const data = new URLSearchParams(text).get('data') || text;
        text = data.startsWith('[') || data.startsWith('{') ? data : Buffer.from(data, 'base64').toString('utf8');
      }
      const payload = JSON.parse(text);
      const events = service === 'amplitude' ? payload.events : Array.isArray(payload) ? payload : [payload];
      for (const event of events || []) {
        const action = event.event_type ?? event.event;
        if (!action) continue;
        const properties = event.event_properties ?? event.properties ?? {};
        if (service === 'amplitude') {
          // Keep only the detection result, never a local path from the payload.
          globalThis.__plmAmplitudeUrlProperties.push({ action,
            keys: Object.keys(properties).filter(key => /^\[Amplitude\] (?:Previous )?Page (?:Domain|Location|Path|Title|URL|Type)$/.test(key)),
            hasLocalFileUrl: /file:\/\//i.test(JSON.stringify(event)),
          });
        }
        // Cancelled requests retry with the same ingestion ID; count events once.
        const id = event.insert_id ?? properties.$insert_id;
        if (id && globalThis.__plmAnalyticsEventIds.has(`${service}:${id}`)) continue;
        if (id) globalThis.__plmAnalyticsEventIds.add(`${service}:${id}`);
        const identity = service === 'amplitude'
          ? { userId: event.user_id, deviceId: event.device_id }
          : { distinctId: properties.distinct_id };
        globalThis.__plmAnalyticsEvents.push({ service, action, category: properties.category,
          label: properties.label, value: properties.value, ...identity });
      }
    } catch {
      globalThis.__plmAnalyticsParseErrors++;
    }
  }

  /** Records and cancels a test's downloads and analytics; PLM_TEST_OFFLINE cancels all else off the computer. */
  function interceptTestTraffic() {
    globalThis.__plmDownloads = [];
    globalThis.__plmAnalyticsEvents = [];
    globalThis.__plmAmplitudeUrlProperties = [];
    globalThis.__plmAnalyticsEventIds = new Set();
    globalThis.__plmAnalyticsParseErrors = 0;
    session.defaultSession.on('will-download', (event, item) => {
      globalThis.__plmDownloads.push(item.getURL());
      event.preventDefault();
    });
    const interceptedUrls = [
      '*://*.analytics.photo-location-map.tomoyukiaota.com/*',
      '*://*.analytics.photo-data-viewer.tomoyukiaota.com/*',
      '*://*.mixpanel.com/*', '*://*.amplitude.com/*',
      '*://*.google-analytics.com/*', '*://www.googletagmanager.com/*',
      'https://github.com/TomoyukiAota/photo-location-map/releases/download/*',
    ];
    // TL;DR: PLM_TEST_OFFLINE=1 also cancels every other request that leaves the computer, so that a measurement does
    // not wait on the network: the map's base-layer list then falls back to its built-in copy, and tiles stay blank.
    // Details: The renderer awaits that list before Angular starts (src/start-app.ts), so its download is part of every
    // startup. Electron keeps one onBeforeRequest listener per session, so this listener does both.
    const offline = process.env.PLM_TEST_OFFLINE === '1';
    globalThis.__plmOfflineCancelled = [];
    session.defaultSession.webRequest.onBeforeRequest({ urls: offline ? ['*://*/*'] : interceptedUrls }, (details, callback) => {
      const { hostname } = new URL(details.url);
      const intercepted = /(^|\.)(analytics\.photo-location-map\.tomoyukiaota\.com|analytics\.photo-data-viewer\.tomoyukiaota\.com|mixpanel\.com|amplitude\.com|google-analytics\.com)$/.test(hostname)
        || hostname === 'www.googletagmanager.com'
        || details.url.startsWith('https://github.com/TomoyukiAota/photo-location-map/releases/download/');
      if (!intercepted) {
        const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(hostname);
        if (!loopback) globalThis.__plmOfflineCancelled.push(details.url);
        callback({ cancel: !loopback });
        return;
      }
      captureAnalytics(details);
      if (details.url.includes('github.com/TomoyukiAota/photo-location-map/releases/download/')) {
        globalThis.__plmDownloads.push(details.url);
      }
      callback({ cancel: true });
    });
  }

  if (app.isReady()) interceptTestTraffic();
  else app.once('ready', interceptTestTraffic);

  // TL;DR: With PLM_TEST_LAUNCH_REPORT set to a file in the test profile, each launch on the profile appends one JSON
  // line there once its home view has rendered: its process ID and the plm: marks of its main process and main
  // window (src-shared/perf/perf-mark.ts), as times since the epoch.
  // Details: A launch that the app starts itself, with app.relaunch() after saving a setting or deleting the cache,
  // is not under the test's control, so it cannot be asked when it is ready. The relaunched process has the same
  // environment, so it writes its line too; the test tells the launches apart by their process IDs.
  const launchReport = process.env.PLM_TEST_LAUNCH_REPORT;
  if (launchReport) {
    const relative = path.relative(testRoot, launchReport);
    if (!path.isAbsolute(launchReport) || !relative || relative === '..' || relative.startsWith(`..${path.sep}`)
      || path.isAbsolute(relative)) {
      throw new Error('PLM_TEST_LAUNCH_REPORT must be a file in PLM_TEST_ROOT.');
    }
    const marksOf = entries => entries.filter(entry => entry.name.startsWith('plm:'))
      .map(entry => ({ name: entry.name, epochMs: performance.timeOrigin + entry.startTime, detail: entry.detail ?? null }));
    let reported = false;
    app.on('browser-window-created', (_event, window) => {
      if (reported) return;
      reported = true; // The first window is the main window.
      const { webContents } = window;
      const startedAt = Date.now();
      /** Appends this launch's line to the report once its home view has rendered, polling for 2 minutes. */
      const poll = async () => {
        if (window.isDestroyed()) return;
        const rendererMarks = await webContents.executeJavaScript(`performance.getEntriesByType('mark')
          .filter(entry => entry.name.startsWith('plm:'))
          .map(entry => ({ name: entry.name, epochMs: performance.timeOrigin + entry.startTime, detail: entry.detail ?? null }))`)
          .catch(() => []);
        if (!rendererMarks.some(mark => mark.name === 'plm:renderer:home-rendered')) {
          if (Date.now() - startedAt < 120000) setTimeout(poll, 50);
          return;
        }
        const line = JSON.stringify({ pid: process.pid, ppid: process.ppid, timeOriginMs: performance.timeOrigin,
          reportedAtMs: Date.now(), mainMarks: marksOf(performance.getEntriesByType('mark')), rendererMarks });
        fs.appendFileSync(launchReport, line + '\n');
      };
      webContents.once('did-finish-load', () => { void poll(); });
    });
  }
}
