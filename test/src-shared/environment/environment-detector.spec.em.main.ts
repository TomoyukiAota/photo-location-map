import assert = require('assert');
import { EnvironmentDetector } from '../../../src-shared/environment/environment-detector';

describe('EnvironmentDetector (in main process in electron-mocha)', () => {
  it('isKarma should be false', () => {
    assert.equal(EnvironmentDetector.isKarma, false);
  });

  it('isElectronMochaMain should be true', () => {
    assert.equal(EnvironmentDetector.isElectronMochaMain, true);
  });

  it('isElectronMochaRenderer should be false', () => {
    assert.equal(EnvironmentDetector.isElectronMochaRenderer, false);
  });

  it('isUnitTest should be true', () => {
    assert.equal(EnvironmentDetector.isUnitTest, true);
  });
});
