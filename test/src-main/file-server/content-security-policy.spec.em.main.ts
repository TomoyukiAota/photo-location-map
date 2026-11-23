import assert from 'assert';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { createRequire } from 'module';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  devServerPageContentSecurityPolicy, mainWindowContentSecurityPolicy, mainWindowPolicyDirectives, stylesheetMediaScriptHash,
} from '../../../src-main/file-server/content-security-policy.js';
import { waybackUrls } from '../../../src-shared/map/dated-layer-urls.js';
import { rasterTileBaseLayerConfigsVersion1Urls } from '../../../src-shared/map/raster-tile-base-layer-configs-version-1-urls.js';

describe('The Content Security Policy of the main window\'s page (in main process)', () => {
  /** The header's directives, as a browser reads them: by name, each with its sources. */
  const parsed = () => mainWindowContentSecurityPolicy.split(';').map(directive => directive.trim().split(/\s+/));

  it('is one header value, with each directive once and its sources', () => {
    const directives = parsed();
    assert.deepStrictEqual(directives.map(([name]) => name), Object.keys(mainWindowPolicyDirectives));
    assert.strictEqual(new Set(directives.map(([name]) => name)).size, directives.length);
    for (const [name, ...sources] of directives)
      assert.deepStrictEqual(sources, mainWindowPolicyDirectives[name], name);
    assert.doesNotMatch(mainWindowContentSecurityPolicy, /[\r\n,]/);
  });

  it('refuses what it does not name, and runs only the scripts and workers of the build: no other inline script, and no eval', () => {
    assert.deepStrictEqual(mainWindowPolicyDirectives['default-src'], [`'none'`]);
    // Plugins, frames and media are refused by default-src. Workers are limited by worker-src: without it, their
    // scripts would be checked against script-src, not default-src.
    for (const name of ['object-src', 'child-src', 'frame-src', 'media-src', 'manifest-src'])
      assert.strictEqual(mainWindowPolicyDirectives[name], undefined, name);
    assert.deepStrictEqual(mainWindowPolicyDirectives['worker-src'], [`'self'`]);
    // WebAssembly is compiled, for the search for faces; strings are never evaluated.
    assert.deepStrictEqual(mainWindowPolicyDirectives['script-src'], [`'self'`, stylesheetMediaScriptHash, `'wasm-unsafe-eval'`]);
    for (const [name, ...sources] of parsed()) {
      for (const source of sources) {
        assert.doesNotMatch(source, /^(\*|'unsafe-eval'|'unsafe-hashes'|'strict-dynamic')$/, `${name} ${source}`);
        assert.doesNotMatch(source, /^https?:\/\/\*/, `${name} ${source}`);
        if (source === `'wasm-unsafe-eval'`)
          assert.strictEqual(name, 'script-src');
      }
    }
  });

  it('lets the page fetch only the list of the map\'s base layers, at its addresses, what the layer of a past date reads, the servers of the analytics SDKs and its own files', () => {
    assert.deepStrictEqual(mainWindowPolicyDirectives['connect-src'], [
      rasterTileBaseLayerConfigsVersion1Urls.gitHub,
      rasterTileBaseLayerConfigsVersion1Urls.jsDelivr,
      'https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json',
      'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tilemap/',
      'https://metadata.maptiles.arcgis.com/arcgis/rest/services/',
      'https://api2.amplitude.com',
      'https://api-js.mixpanel.com',
      `'self'`,
    ]);
  });

  it('lets the layer of a past date connect to its folders and files only, which the renderer reads from the same module', () => {
    const connect = mainWindowPolicyDirectives['connect-src'];
    for (const url of [waybackUrls.releases, waybackUrls.tilemap, waybackUrls.metadata])
      assert.ok(connect.includes(url), url);
    // Its tiles are images, which img-src lets load from any server on https.
    assert.ok(waybackUrls.tile.startsWith('https://'));
  });

  it('is the same for the page of ng serve in live reload, which connects to its own origin', () => {
    assert.strictEqual(devServerPageContentSecurityPolicy, mainWindowContentSecurityPolicy);
  });

  it('keeps the page\'s base address, sends no form, and is no other page\'s frame', () => {
    assert.deepStrictEqual(mainWindowPolicyDirectives['base-uri'], [`'self'`]);
    assert.deepStrictEqual(mainWindowPolicyDirectives['form-action'], [`'none'`]);
    assert.deepStrictEqual(mainWindowPolicyDirectives['frame-ancestors'], [`'none'`]);
  });

  // TL;DR: The hash is of the script that Beasties writes, as Angular's build runs it, so that an update of either
  // that changes the script fails here, and not only in the e2e suite, whose every case would then see the page refuse
  // the script.
  // Details: Beasties is a dependency of @angular/build, found from there as the build finds it; the options are those
  // of the build's inline-critical-css.js that decide the script (preload: 'media-script').
  it('allows the inline script of index.html by the hash of the script that the Beasties of Angular\'s build writes', async () => {
    const angularBuild = createRequire(import.meta.url).resolve('@angular/build/package.json');
    const { default: Beasties } = await import(pathToFileURL(createRequire(angularBuild).resolve('beasties')).href);
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-csp-'));
    try {
      fs.writeFileSync(path.join(folder, 'styles.css'), 'p { color: red; } .not-on-the-page { color: blue; }');
      const beasties = new Beasties({ path: folder, publicPath: '', logLevel: 'silent', pruneSource: false,
        reduceInlineStyles: false, mergeStylesheets: false, preload: 'media-script', noscriptFallback: true });
      const html: string = await beasties.process(
        '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head><body><p>A page</p></body></html>');
      const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(([, script]) => script);
      assert.strictEqual(inlineScripts.length, 1, html);
      const hash = crypto.createHash('sha256').update(inlineScripts[0], 'utf8').digest('base64');
      assert.strictEqual(`'sha256-${hash}'`, stylesheetMediaScriptHash,
        `The script of Beasties changed: put its hash in content-security-policy.ts. The script: ${inlineScripts[0]}`);
    } finally {
      fs.rmSync(folder, { recursive: true, force: true });
    }
  });
});
