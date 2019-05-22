import assert = require('assert');
import { ProcessIdentifier } from '../../../src-shared/process/process-identifier';

describe('ProcessIdentifier (in renderer process in electron-mocha)', () => {
  it('isNode should be true', () => {
    assert(ProcessIdentifier.isNode === true);
  });

  it('isElectron should be true', () => {
    assert(ProcessIdentifier.isElectron === true);
  });

  it('isElectronMain should be false', () => {
    assert(ProcessIdentifier.isElectronMain === false);
  });

  it('isElectronRenderer should be true', () => {
    assert(ProcessIdentifier.isElectronRenderer === true);
  });

  it('processType should be "Renderer"', () => {
    assert(ProcessIdentifier.processType === 'Renderer');
  });
});
