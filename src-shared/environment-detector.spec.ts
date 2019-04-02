import { EnvironmentDetector } from './environment-detector';

describe('EnvironmentDetector', () => {
  it('isKarma() should return true', () => {
    expect(EnvironmentDetector.isKarma()).toEqual(true);
  });

  it('isUnitTest() should return true', () => {
    expect(EnvironmentDetector.isUnitTest()).toEqual(true);
  });
});
