import assert from 'assert';
import { EnvironmentDetector } from '../../../src-shared/environment/environment-detector.js';

describe('EnvironmentDetector (in main process in electron-mocha)', () => {
  it('isVitest should be false', () => {
    assert.equal(EnvironmentDetector.isVitest, false);
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
