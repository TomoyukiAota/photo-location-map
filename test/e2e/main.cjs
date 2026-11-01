const path = require('node:path');
const { app, session } = require('electron');
const root = path.resolve(__dirname, '../..');
globalThis.__plmTestRequire = require;
app.setAppPath(root);
// A bare .cjs entry has Electron's package version rather than the app manifest.
app.getVersion = () => require('../../package.json').version;
// Playwright places its debugging flags before the entry point. Commander
// should see only application arguments, as it does in a normal app launch.
process.argv = [process.execPath, root,
  ...(process.env.PLM_E2E_OPEN ? ['--open', process.env.PLM_E2E_OPEN] : [])];
require('../../electron-util/isolated-test-profile');
function captureAnalytics(details) {
  const service = details.url.includes('amplitude.com') ? 'amplitude'
    : details.url.includes('mixpanel.com') ? 'mixpanel' : undefined;
  if (!service || !details.uploadData) return;
  try {
    let body = Buffer.concat(details.uploadData.filter(part => part.bytes).map(part => part.bytes));
    if (body[0] === 0x1f && body[1] === 0x8b) body = require('node:zlib').gunzipSync(body);
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
      // Cancelled requests retry with the same ingestion ID; count events once.
      const id = event.insert_id ?? properties.$insert_id;
      if (id && globalThis.__plmAnalyticsEventIds.has(`${service}:${id}`)) continue;
      if (id) globalThis.__plmAnalyticsEventIds.add(`${service}:${id}`);
      globalThis.__plmAnalyticsEvents.push({ service, action, category: properties.category,
        label: properties.label, value: properties.value });
    }
  } catch {
    globalThis.__plmAnalyticsParseErrors++;
  }
}
app.on('ready', () => {
  globalThis.__plmDownloads = [];
  globalThis.__plmAnalyticsEvents = [];
  globalThis.__plmAnalyticsEventIds = new Set();
  globalThis.__plmAnalyticsParseErrors = 0;
  session.defaultSession.on('will-download', (event, item) => {
    globalThis.__plmDownloads.push(item.getURL());
    event.preventDefault();
  });
  session.defaultSession.webRequest.onBeforeRequest({ urls: [
    '*://*.analytics.photo-location-map.tomoyukiaota.com/*',
    '*://*.analytics.photo-data-viewer.tomoyukiaota.com/*',
    '*://*.mixpanel.com/*', '*://*.amplitude.com/*',
    '*://*.google-analytics.com/*', '*://www.googletagmanager.com/*',
    'https://github.com/TomoyukiAota/photo-location-map/releases/download/*',
  ] }, (details, callback) => {
    captureAnalytics(details);
    if (details.url.includes('github.com/TomoyukiAota/photo-location-map/releases/download/')) {
      globalThis.__plmDownloads.push(details.url);
    }
    callback({ cancel: true });
  });
});
require('../../src-main/electron-main.js');
