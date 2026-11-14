import assert from 'assert';
import type { UpdateInfo } from 'electron-updater';
import { currentSystemVersion, isVersionAtLeast, minimumSystemVersionOf } from '../../../src-main/auto-update/minimum-system-version.js';

describe('Minimum OS version of an update', () => {
  const updateInfo = (fields: object) => ({ version: '2.0.0', files: [], path: '', sha512: '', releaseDate: '', ...fields }) as UpdateInfo;

  it('reads the minimum that electron-builder copies from releaseInfo.vendor', () => {
    assert.equal(minimumSystemVersionOf(updateInfo({ vendor: { minimumSystemVersion: '13.0' } })), '13.0');
    assert.equal(minimumSystemVersionOf(updateInfo({ vendor: { minimumSystemVersion: '10.0.22000' } })), '10.0.22000');
  });

  it('has no minimum for releases published without one', () => {
    for (const fields of [{}, { vendor: null }, { vendor: {} }, { vendor: { minimumSystemVersion: 13 } }]) {
      assert.equal(minimumSystemVersionOf(updateInfo(fields)), undefined);
    }
  });

  it('ignores the top-level minimumSystemVersion, which electron-updater compares with os.release()', () => {
    assert.equal(minimumSystemVersionOf(updateInfo({ minimumSystemVersion: '22.0.0' })), undefined);
  });

  it('compares macOS versions part by part as numbers', () => {
    assert.equal(isVersionAtLeast('13.0', '13.0'), true);
    assert.equal(isVersionAtLeast('13.6.1', '13.0'), true);
    assert.equal(isVersionAtLeast('26.1', '13.0'), true);
    assert.equal(isVersionAtLeast('12.7.6', '13.0'), false);
    assert.equal(isVersionAtLeast('13.6.1', '14'), false);
    assert.equal(isVersionAtLeast('10.15.7', '10.9'), true);
  });

  it('compares Windows versions, where Windows 11 is 10.0.22000 or later', () => {
    assert.equal(isVersionAtLeast('10.0.19045', '10.0'), true);
    assert.equal(isVersionAtLeast('10.0.26100', '10.0.22000'), true);
    assert.equal(isVersionAtLeast('10.0.19045', '10.0.22000'), false);
    assert.equal(isVersionAtLeast('6.1.7601', '10.0'), false);
  });

  it('counts a missing part as 0', () => {
    assert.equal(isVersionAtLeast('13', '13.0.0'), true);
    assert.equal(isVersionAtLeast('13.0.0', '13.0.1'), false);
  });

  it('cannot compare anything other than numbers separated by dots', () => {
    for (const [version, minimum] of [['13.0', ''], ['13.0', '13.x'], ['13.0', 'v13'], ['', '13.0'], ['13.0 beta', '13.0']]) {
      assert.equal(isVersionAtLeast(version, minimum), undefined, `${version} and ${minimum}`);
    }
  });

  it('gives the version of macOS and Windows, and nothing on other platforms', () => {
    assert.deepEqual(currentSystemVersion('darwin', () => '12.7.6'), { name: 'macOS', version: '12.7.6' });
    assert.deepEqual(currentSystemVersion('win32', () => '10.0.19045'), { name: 'Windows', version: '10.0.19045' });
    assert.equal(currentSystemVersion('linux', () => '6.8.0-45-generic'), undefined);
  });

  it('reads the version of this computer by default', () => {
    const expected = ['darwin', 'win32'].includes(process.platform) ? process.getSystemVersion() : undefined;
    assert.equal(currentSystemVersion()?.version, expected);
    if (expected !== undefined)
      assert.equal(isVersionAtLeast(expected, '10.0'), true);
  });
});
