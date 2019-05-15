import assert = require('assert');
import { EnvironmentDetector } from '../../../src-shared/environment/environment-detector';

describe('EnvironmentDetector (in main process in electron-mocha)', () => {
  it('isKarma should be false', () => {
    assert(EnvironmentDetector.isKarma === false);
  });

  it('isElectronMochaMain should be true', () => {
    assert(EnvironmentDetector.isElectronMochaMain === true);
  });

  it('isElectronMochaRenderer should be false', () => {
    assert(EnvironmentDetector.isElectronMochaRenderer === false);
  });

  it('isUnitTest should be true', () => {
    assert(EnvironmentDetector.isUnitTest === true);
  });
});
