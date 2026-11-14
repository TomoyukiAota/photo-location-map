import assert from 'assert';
import { EnvironmentDetector } from '../../../src-shared/environment/environment-detector.js';

describe('EnvironmentDetector (in renderer process in electron-mocha)', () => {
  it('isVitest should be false', () => {
    assert(EnvironmentDetector.isVitest === false);
  });

  it('isElectronMochaMain should be false', () => {
    assert(EnvironmentDetector.isElectronMochaMain === false);
  });

  it('isElectronMochaRenderer should be true', () => {
    assert(EnvironmentDetector.isElectronMochaRenderer === true);
  });

  it('isUnitTest should be true', () => {
    assert(EnvironmentDetector.isUnitTest === true);
  });
});
