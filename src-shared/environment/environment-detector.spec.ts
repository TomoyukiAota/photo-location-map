import { EnvironmentDetector } from './environment-detector';

describe('EnvironmentDetector (in renderer process in Karma)', () => {
  it('isKarma should be true', () => {
    expect(EnvironmentDetector.isKarma).toEqual(true);
  });

  it('isElectronMochaMain should be false', () => {
    expect(EnvironmentDetector.isElectronMochaMain).toEqual(false);
  });

  it('isUnitTest should be true', () => {
    expect(EnvironmentDetector.isUnitTest).toEqual(true);
  });
});
