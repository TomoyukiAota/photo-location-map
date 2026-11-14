import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { preloadAppChunk } from '../../script/build/preload-app-chunk.js';

describe('preloadAppChunk (script/build/)', () => {
  let dist: string;
  const script = '<script src="main.js" type="module"></script>';
  const build = (entry: string, index = `<html><head></head><body>${script}</body></html>`) => {
    fs.writeFileSync(path.join(dist, 'main.js'), entry);
    fs.writeFileSync(path.join(dist, 'index.html'), index);
  };
  const index = () => fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  beforeEach(() => { dist = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-dist-')); });
  afterEach(() => fs.rmSync(dist, { recursive: true, force: true }));

  it('preloads the one chunk that the entry imports, once however often it runs', () => {
    build('whenBridgeReady().then(()=>import(`./chunk-DnECwfgY.js`))');
    assert.strictEqual(preloadAppChunk(dist), 'chunk-DnECwfgY.js');
    preloadAppChunk(dist);
    assert.strictEqual(index(), `<html><head></head><body><link rel="modulepreload" href="chunk-DnECwfgY.js">${script}</body></html>`);
  });

  it('reads an import written with quotes, as a build without optimization writes it', () => {
    build('whenBridgeReady().then(() => import("./chunk-ABC_12-x.js"));');
    assert.strictEqual(preloadAppChunk(dist), 'chunk-ABC_12-x.js');
  });

  it('fails the build when the entry imports no chunk or several, or the page has no entry', () => {
    build('console.log(1)');
    assert.throws(() => preloadAppChunk(dist), /imports 0/);
    build('import(`./chunk-a.js`); import(`./chunk-b.js`)');
    assert.throws(() => preloadAppChunk(dist), /imports 2/);
    build('import(`./chunk-a.js`)', '<html></html>');
    assert.throws(() => preloadAppChunk(dist), /has no <script src="main.js"/);
  });
});
