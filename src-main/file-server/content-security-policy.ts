import { waybackUrls } from '../../src-shared/map/dated-layer-urls.js';
import { rasterTileBaseLayerConfigsVersion1Urls } from '../../src-shared/map/raster-tile-base-layer-configs-version-1-urls.js';

// TL;DR: The Content Security Policy of the main window's page: what the page may run, load and send, each source
// with why it is allowed. Anything else is refused.
// Details: The handler of plm-app: sends it with each file of the page (app-page.ts), and live reload with each answer
// of ng serve (file-server.ts), so that a development run has the policy of a release
// (devServerPageContentSecurityPolicy). It is a response header, not a <meta> of index.html: a header
// applies before the page is parsed, and also gives frame-ancestors, which a <meta> cannot. A violation is in the
// console of the page (src/main.ts writes those that Chromium does not), which the main process writes to the log and
// records for analytics (src-main/record-console-errors.ts); the e2e suite fails a case in which the page had one
// (test/e2e/regression.spec.mjs). Electron's security checklist asks for a policy:
// https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy

/**
 * The hash of the one inline script of the page. Angular's production build inlines the CSS that the page needs
 * first, with Beasties, and loads styles.css as a stylesheet for print, which this script, at the end of index.html,
 * applies to the screen once it has loaded (`preload: 'media-script'` in @angular/build's inline-critical-css.js).
 * The script is the same in every build, as Beasties writes it. A test checks that the hash is that of the script
 * of the Beasties that Angular's build uses (test/src-main/file-server/content-security-policy.spec.em.main.ts).
 */
export const stylesheetMediaScriptHash = `'sha256-LMY6wYoFV9I4wWzxaq1N/dTpl4iurQktw706UCHK3vM='`;

/** The policy's directives, with the sources that each allows. */
export const mainWindowPolicyDirectives: Readonly<Record<string, readonly string[]>> = {
  // What no directive below names is refused: frames, plugins (object-src), audio and video, manifests.
  'default-src': [`'none'`],
  'script-src': [
    // The scripts of the app's build: its entry, its chunks and scripts.js, which has Leaflet and its plugins; in
    // live reload, ng serve's client too. Nothing else, and no eval(): nothing of the page evaluates a string, as
    // Angular compiles its templates when the app is built, for a development build too (aot in angular.json).
    `'self'`,
    stylesheetMediaScriptHash,
    // TL;DR: WebAssembly, for the search for faces, whose model runs on ONNX Runtime Web (src/app/face-search/). It
    // compiles WebAssembly only: eval() and new Function() stay refused.
    // Details: The worker of the search has this policy too, as every file of the page does (app-page.ts), and the
    // runtime compiles its .wasm file, from the app's build, there.
    `'wasm-unsafe-eval'`,
  ],
  // TL;DR: The workers of the app's build only: that of the search for faces (src/app/face-search/). Without this
  // directive, a worker's script would be checked against script-src, and not against default-src.
  // Details: The only other worker in the page's build is that of the session recording of Mixpanel's SDK (rrweb, for
  // canvases), which runs only for a record_sessions_percent above 0, its default, which the app does not change; it
  // would be made from a blob:, which stays refused.
  'worker-src': [`'self'`],
  'style-src': [
    // styles.css.
    `'self'`,
    // TL;DR: The inline styles that the page has, and those that Angular and ECharts make.
    // Details: Angular puts the styles of each component in a <style> element of its own, and sets the style
    // attribute of a template with setAttribute (directory-tree-view.component.html); the HTML of ECharts' tooltips
    // has style attributes; index.html has the CSS that it needs first and the fonts' rules inline. A nonce (Angular's
    // ngCspNonce) would cover the <style> elements, not the attributes. A style that a text shown by the page injected
    // could send out no more than an image can, which img-src below lets load from any server on https.
    `'unsafe-inline'`,
    // The stylesheets of Google Fonts for Roboto and Material Icons, which index.html links: a development build loads
    // them, and a production build has them inline.
    'https://fonts.googleapis.com',
  ],
  // The fonts of those stylesheets.
  'font-src': ['https://fonts.gstatic.com'],
  'img-src': [
    // The favicon, and the images of Leaflet's CSS, which the build copies to media/.
    `'self'`,
    // The icons of src/assets/icon-data-url.ts and of Leaflet-Geoman's CSS, and a photo's Exif thumbnail, which the page
    // turns as the photo's orientation says (src/app/shared/image-rotation.ts).
    'data:',
    // The turned thumbnail.
    'blob:',
    // The photos and the HEIF thumbnails of the folders that the user opened (photo-files.ts).
    'plm-file:',
    // The map's tiles. The list of the base layers names their servers, and the app downloads it, so that a provider
    // can be added or changed without a release (raster-tile-base-layer-configs-version-1-urls.ts): a server that the
    // list names later is on https too, which a release before then cannot know.
    'https:',
  ],
  'connect-src': [
    // The list of the map's base layers, at the two addresses that the page tries, and no other of their servers.
    ...Object.values(rasterTileBaseLayerConfigsVersion1Urls),
    // TL;DR: The layer of the map that shows a past date (src-shared/map/dated-layer-urls.ts): what Esri World Imagery
    // Wayback tells of its releases and their imagery.
    // Details: Wayback's tiles are images, which img-src allows.
    waybackUrls.releases,
    waybackUrls.tilemap,
    waybackUrls.metadata,
    // The browser SDKs of analytics, which run in the page (src-shared/analytics/analytics-renderer.ts), send to these;
    // the events of the analytics backend go from the main process.
    'https://api2.amplitude.com',
    'https://api-js.mixpanel.com',
    // The files of the app's build that the worker of the search for faces fetches: the runtime's .wasm file and the
    // model (src/app/face-search/). In live reload, the client of ng serve in the page connects to its origin too, with
    // a WebSocket and a fetch().
    `'self'`,
  ],
  // index.html's <base href="">, which is the page's own address.
  'base-uri': [`'self'`],
  // The page submits no form, and is no other page's frame.
  'form-action': [`'none'`],
  'frame-ancestors': [`'none'`],
};

/** The value of a Content-Security-Policy header with `directives`. */
function headerValue(directives: Readonly<Record<string, readonly string[]>>): string {
  return Object.entries(directives).map(([directive, sources]) => `${directive} ${sources.join(' ')}`).join('; ');
}

/** The policy, as the value of a Content-Security-Policy header. */
export const mainWindowContentSecurityPolicy = headerValue(mainWindowPolicyDirectives);

/**
 * The policy of the page of ng serve in live reload (file-server.ts): that of a release, which lets the page connect
 * to its own origin, ng serve's there, as the client of ng serve in the page does, with a WebSocket and a fetch().
 */
export const devServerPageContentSecurityPolicy = mainWindowContentSecurityPolicy;
