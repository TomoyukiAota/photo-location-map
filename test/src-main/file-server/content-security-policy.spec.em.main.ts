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

  it('refuses what it does not name, and runs only the scripts of the build: no other inline script, and no eval', () => {
    assert.deepStrictEqual(mainWindowPolicyDirectives['default-src'], [`'none'`]);
    // Plugins, frames, workers and media are refused by default-src.
    for (const name of ['object-src', 'child-src', 'frame-src', 'worker-src', 'media-src', 'manifest-src'])
      assert.strictEqual(mainWindowPolicyDirectives[name], undefined, name);
    assert.deepStrictEqual(mainWindowPolicyDirectives['script-src'], [`'self'`, stylesheetMediaScriptHash]);
    for (const [name, ...sources] of parsed()) {
      for (const source of sources) {
        assert.doesNotMatch(source, /^(\*|'unsafe-eval'|'wasm-unsafe-eval'|'unsafe-hashes'|'strict-dynamic')$/, `${name} ${source}`);
        assert.doesNotMatch(source, /^https?:\/\/\*/, `${name} ${source}`);
      }
    }
  });

  it('lets the page fetch only the list of the map\'s base layers, at its addresses, and the servers of the analytics SDKs', () => {
    assert.deepStrictEqual(mainWindowPolicyDirectives['connect-src'], [
      rasterTileBaseLayerConfigsVersion1Urls.gitHub,
      rasterTileBaseLayerConfigsVersion1Urls.jsDelivr,
      'https://api2.amplitude.com',
      'https://api-js.mixpanel.com',
    ]);
  });

  it('is the same for the page of ng serve in live reload, but that the page may connect to its own origin', () => {
    const release = mainWindowContentSecurityPolicy.split('; ');
    const devServer = devServerPageContentSecurityPolicy.split('; ');
    assert.deepStrictEqual(devServer.filter(directive => !directive.startsWith('connect-src ')),
      release.filter(directive => !directive.startsWith('connect-src ')));
    assert.strictEqual(devServer.find(directive => directive.startsWith('connect-src ')),
      `${release.find(directive => directive.startsWith('connect-src '))} 'self'`);
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
