const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const builderRequire = createRequire(require.resolve('app-builder-lib/package.json'));
const universalRequire = createRequire(builderRequire.resolve('@electron/universal/package.json'));
const installerRequire = createRequire(require.resolve('electron-winstaller/package.json'));
const tempRequire = createRequire(installerRequire.resolve('temp/package.json'));

test('the locked tree contains no deprecated packages, Karma or local compatibility packages', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  assert.deepEqual(Object.entries(lock.packages).filter(([, info]) => info.deprecated).map(([name]) => name), []);
  assert.deepEqual(Object.keys(lock.packages).filter(name =>
    /(?:^|\/)node_modules\/(?:karma(?:-|$)|jasmine-core$|@photo-location-map\/legacy-)/.test(name)), []);
  assert.equal(fs.existsSync(path.join(root, 'compat')), false,
    'Compatibility packages must not be reintroduced; review the maintained consumer APIs.');
});

test('actual packaging consumers resolve the reviewed maintained ASAR and removal APIs', () => {
  for (const resolveFrom of [builderRequire, universalRequire, installerRequire]) {
    const metadata = path.resolve(path.dirname(resolveFrom.resolve('@electron/asar')), '../package.json');
    assert.equal(JSON.parse(fs.readFileSync(metadata, 'utf8')).version, '4.3.1');
    const asar = resolveFrom('@electron/asar');
    for (const method of ['createPackageWithOptions', 'extractFile', 'extractAll', 'statFile', 'getRawHeader'])
      assert.equal(typeof asar[method], 'function');
  }
  assert.equal(tempRequire('rimraf/package.json').version, '6.1.4');
  assert.equal(typeof tempRequire('rimraf').rimraf, 'function');
  assert.equal(typeof tempRequire('rimraf').sync, 'function');
});
