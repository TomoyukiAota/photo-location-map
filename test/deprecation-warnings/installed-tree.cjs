const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const rootRequire = createRequire(path.join(root, 'package.json'));
const karmaRequire = createRequire(require.resolve('karma/package.json'));
const builderRequire = createRequire(require.resolve('app-builder-lib/package.json'));
const asarRequire = createRequire(builderRequire.resolve('@electron/asar/package.json'));
const installerRequire = createRequire(require.resolve('electron-winstaller/package.json'));
const tempRequire = createRequire(installerRequire.resolve('temp/package.json'));

test('the locked dependency tree contains no deprecated packages', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const deprecated = Object.entries(lock.packages).filter(([, info]) => info.deprecated).map(([name]) => name);
  assert.deepEqual(deprecated, [], 'Resolve deprecated dependency paths before accepting an updated lockfile.');
  for (const name of ['legacy-glob', 'legacy-rimraf']) {
    assert.notEqual(lock.packages[`node_modules/@photo-location-map/${name}`]?.link, true,
      'Direct compatibility adapters must stay packed in the lockfile.');
  }
});

test('actual consumers resolve the current packed adapter sources', () => {
  for (const [consumer, resolveFrom, dependency, adapter] of [
    ['Root glob adapter', rootRequire, '@photo-location-map/legacy-glob', 'glob'],
    ['Root removal adapter', rootRequire, '@photo-location-map/legacy-rimraf', 'rimraf'],
    ['Karma', karmaRequire, 'glob', 'glob'],
    ['ASAR', asarRequire, 'glob', 'glob'],
    ['Karma', karmaRequire, 'rimraf', 'rimraf'],
    ['Temp', tempRequire, 'rimraf', 'rimraf'],
  ]) {
    const metadata = resolveFrom(`${dependency}/package.json`);
    assert.equal(metadata.name, `@photo-location-map/legacy-${adapter}`, `${consumer} must use its scoped compatibility adapter.`);
    const digest = filename => createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
    assert.equal(digest(resolveFrom.resolve(dependency)), digest(path.join(root, 'compat', adapter, 'index.cjs')),
      `${consumer} has a stale packed adapter. Run npm ci after editing compat/.`);
  }
  for (const name of ['legacy-glob', 'legacy-rimraf']) {
    assert.equal(fs.lstatSync(path.join(root, 'node_modules/@photo-location-map', name)).isSymbolicLink(), false,
      'Local adapters must be packed with install-links=true. Reinstall the direct adapters explicitly if npm retained old links.');
  }
});
