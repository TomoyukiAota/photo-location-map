import { ProcessIdentifier } from './process-identifier';

describe('ProcessIdentifier (in renderer process)', () => {
  it('isNode should be true', () => {
    expect(ProcessIdentifier.isNode).toEqual(true);
  });

  it('isElectron should be true', () => {
    expect(ProcessIdentifier.isElectron).toEqual(true);
  });

  it('isElectronMain should be false', () => {
    expect(ProcessIdentifier.isElectronMain).toEqual(false);
  });

  it('isElectronRenderer should be true', () => {
    expect(ProcessIdentifier.isElectronRenderer).toEqual(true);
  });

  it('processType should be "Renderer"', () => {
    expect(ProcessIdentifier.processType).toEqual('Renderer');
  });
});
