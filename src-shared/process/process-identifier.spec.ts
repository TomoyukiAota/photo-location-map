import { ProcessIdentifier } from './process-identifier';

describe('ProcessIdentifier (in renderer process)', () => {
  it('isNode should return true', () => {
    expect(ProcessIdentifier.isNode).toEqual(true);
  });

  it('isElectron should return true', () => {
    expect(ProcessIdentifier.isElectron).toEqual(true);
  });

  it('isElectronMain should return false', () => {
    expect(ProcessIdentifier.isElectronMain).toEqual(false);
  });

  it('isElectronRenderer should return true', () => {
    expect(ProcessIdentifier.isElectronRenderer).toEqual(true);
  });

  it('processType should return "Renderer"', () => {
    expect(ProcessIdentifier.processType).toEqual('Renderer');
  });
});
