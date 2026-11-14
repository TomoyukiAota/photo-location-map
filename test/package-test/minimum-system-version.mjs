import assert from 'node:assert/strict';
import test from 'node:test';
import builderConfig from '../../electron-builder.json' with { type: 'json' };
import {
  buildMinimumsOf, checkMacMinimumSystemVersion, checkWindowsMinimumSystemVersion, compareVersions, feedMinimumOf,
} from '../../script/package-test/minimum-system-version.js';

const otoolOutput = minimums => minimums.map((minos, index) => `Electron Framework (architecture ${index ? 'arm64' : 'x86_64'}):
Load command 9
      cmd LC_BUILD_VERSION
  cmdsize 32
 platform 1
    minos ${minos}
      sdk 26.5
   ntools 1
`).join('');

const updateInfoYml = (file, vendor) => `version: 1.13.0
files:
  - url: ${file}
    sha512: c2hhNTEy
    size: 236559828
path: ${file}
sha512: c2hhNTEy
${vendor}releaseDate: '2026-11-04T00:00:00.000Z'
`;

const consistentMac = { configured: '13.0', vendor: '13.0', plist: '13.0', feed: '13.0', electron: ['13.0', '13.0'] };

test('versions compare part by part as numbers', () => {
  assert.equal(compareVersions('13.0', '13.0'), 0);
  assert.equal(compareVersions('13', '13.0.0'), 0);
  assert.ok(compareVersions('12.7', '13.0') < 0);
  assert.ok(compareVersions('14.0', '13.6') > 0);
  assert.ok(compareVersions('10.15', '10.9') > 0);
  assert.ok(compareVersions('10.0.19045', '10.0.22000') < 0);
});

test('otool output gives the minimum macOS of every architecture', () => {
  assert.deepEqual(buildMinimumsOf(otoolOutput(['13.0', '14.0'])), ['13.0', '14.0']);
  assert.deepEqual(buildMinimumsOf('Electron Framework (architecture arm64):\n      cmd LC_LOAD_DYLIB\n'), []);
});

test('latest-mac.yml and latest.yml give the minimum that electron-builder copied from releaseInfo.vendor', () => {
  const zip = 'Photo-Location-Map-1.13.0-universal-mac.zip';
  assert.equal(feedMinimumOf(updateInfoYml(zip, 'vendor:\n  minimumSystemVersion: \'13.0\'\n')), '13.0');
  assert.equal(feedMinimumOf(updateInfoYml(zip, 'vendor:\r\n  minimumSystemVersion: "14.1"\r\n')), '14.1');
  assert.equal(feedMinimumOf(updateInfoYml('Photo-Location-Map-Setup-1.13.0.exe', 'vendor:\n  minimumSystemVersion: \'10.0\'\n')), '10.0');
  assert.equal(feedMinimumOf(updateInfoYml(zip, '')), undefined);
});

test('a macOS minimum declared the same everywhere, at least what Electron needs, passes', () => {
  assert.equal(checkMacMinimumSystemVersion(consistentMac), '13.0');
  assert.equal(checkMacMinimumSystemVersion({ ...consistentMac, configured: '14.0', vendor: '14.0', plist: '14.0', feed: '14.0' }), '13.0');
});

test('an Electron upgrade that raises the macOS minimum fails until electron-builder.json is raised too', () => {
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, electron: ['14.0', '14.0'] }),
    /Electron is built for macOS 14\.0 or later, but electron-builder\.json declares 13\.0\. Raise mac\.minimumSystemVersion/);
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, electron: ['13.0', '14.0'] }), /built for macOS 14\.0/);
});

test('each declared macOS minimum has to match mac.minimumSystemVersion', () => {
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, vendor: undefined }), /mac\.releaseInfo\.vendor\.minimumSystemVersion .* is undefined/);
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, plist: '12.0' }), /LSMinimumSystemVersion .* is 12\.0/);
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, feed: undefined }), /latest-mac\.yml is undefined/);
});

test('an unreadable macOS minimum fails instead of passing', () => {
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, electron: [] }), /Could not read the minimum macOS/);
  assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, electron: ['13.x'] }), /Could not read the minimum macOS/);
  for (const configured of [undefined, '13.x', 13]) {
    assert.throws(() => checkMacMinimumSystemVersion({ ...consistentMac, configured }), /must be a version such as 13\.0/);
  }
});

test('latest.yml has to carry the declared Windows minimum', () => {
  checkWindowsMinimumSystemVersion({ configured: '10.0', feed: '10.0' });
  checkWindowsMinimumSystemVersion({ configured: '10.0.22000', feed: '10.0.22000' });
  assert.throws(() => checkWindowsMinimumSystemVersion({ configured: '10.0', feed: undefined }), /latest\.yml is undefined/);
  assert.throws(() => checkWindowsMinimumSystemVersion({ configured: '10.0.22000', feed: '10.0' }), /latest\.yml is 10\.0/);
  for (const configured of [undefined, 'Windows 10', 10]) {
    assert.throws(() => checkWindowsMinimumSystemVersion({ configured, feed: '10.0' }), /win\.releaseInfo\.vendor\.minimumSystemVersion .* must be a version/);
  }
});

test('electron-builder.json declares the macOS minimum the same for Info.plist and latest-mac.yml', () => {
  assert.match(builderConfig.mac.minimumSystemVersion, /^\d+(\.\d+)*$/);
  assert.equal(builderConfig.mac.releaseInfo?.vendor?.minimumSystemVersion, builderConfig.mac.minimumSystemVersion);
});

test('electron-builder.json declares a Windows minimum for latest.yml', () => {
  assert.match(builderConfig.win.releaseInfo?.vendor?.minimumSystemVersion, /^\d+(\.\d+)*$/);
});
