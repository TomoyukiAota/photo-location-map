import assert = require('assert');
import { EnvironmentDetector } from '../../../src-shared/environment/environment-detector';

describe('EnvironmentDetector (in main process in electron-mocha)', () => {
  it('isKarma should return false', () => {
    assert(EnvironmentDetector.isKarma === false);
  });

  it('isElectronMochaMain() should return true', () => {
    assert(EnvironmentDetector.isElectronMochaMain() === true);
  });

  it('isUnitTest() should return true', () => {
    assert(EnvironmentDetector.isUnitTest() === true);
  });
});
