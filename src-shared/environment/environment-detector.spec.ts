import { EnvironmentDetector } from './environment-detector.js';
import { ProcessIdentifier } from '../process/process-identifier.js';

describe('EnvironmentDetector (in Vitest)', () => {
  it('isVitest should be true', () => {
    expect(EnvironmentDetector.isVitest).toEqual(true);
  });

  it('uses genuine Node/jsdom without impersonating an Electron renderer', () => {
    expect(ProcessIdentifier.isNode).toBe(true);
    expect(ProcessIdentifier.isElectron).toBe(false);
    expect(ProcessIdentifier.processType).toBe('Node');
    expect((window as Window & { require?: unknown }).require).toBeUndefined();
  });

  it('isElectronMochaMain should be false', () => {
    expect(EnvironmentDetector.isElectronMochaMain).toEqual(false);
  });

  it('isElectronMochaRenderer should be false', () => {
    expect(EnvironmentDetector.isElectronMochaRenderer).toEqual(false);
  });

  it('isUnitTest should be true', () => {
    expect(EnvironmentDetector.isUnitTest).toEqual(true);
  });
});
