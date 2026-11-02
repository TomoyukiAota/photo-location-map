// Fixed test support shared by checkout and packaged launches. No external code
// is loaded from environment variables, and ordinary launches do not enter here.
const testRoot = process.env.PLM_TEST_ROOT;
const automated = process.env.PLM_E2E === '1';

if (automated && (!testRoot || !require('node:path').isAbsolute(testRoot))) {
  throw new Error('PLM_E2E requires an absolute PLM_TEST_ROOT.');
}

if (testRoot) {
  const { app, session } = require('electron');
  if (automated) {
    // Preserve Electron/Commander argument conventions and ordinary CLI options.
    // These exact flags are added by Playwright, including its Linux default.
    const debuggingFlags = new Set(['--inspect=0', '--remote-debugging-port=0', '--no-sandbox']);
    process.argv = process.argv.filter((arg, index) => index === 0 || !debuggingFlags.has(arg));
    globalThis.__plmTestRequire = require;
  }

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

  function interceptTestTraffic() {
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
  }

  if (app.isReady()) interceptTestTraffic();
  else app.once('ready', interceptTestTraffic);
}
