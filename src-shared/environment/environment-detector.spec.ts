import { EnvironmentDetector } from './environment-detector';

describe('EnvironmentDetector (in renderer process in Karma)', () => {
  it('isKarma should return true', () => {
    expect(EnvironmentDetector.isKarma).toEqual(true);
  });

  it('isElectronMochaMain should return false', () => {
    expect(EnvironmentDetector.isElectronMochaMain).toEqual(false);
  });

  it('isUnitTest should return true', () => {
    expect(EnvironmentDetector.isUnitTest).toEqual(true);
  });
});
