import assert = require('assert');
import { EnvironmentDetector } from '../../../src-shared/environment/environment-detector';

describe('EnvironmentDetector (in renderer process in electron-mocha)', () => {
  it('isKarma should be false', () => {
    assert(EnvironmentDetector.isKarma === false);
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
