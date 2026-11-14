import assert from 'assert';
import { ProcessIdentifier } from '../../../src-shared/process/process-identifier.js';

describe('ProcessIdentifier (in main process in electron-mocha)', () => {
  it('isNode should be true', () => {
    assert(ProcessIdentifier.isNode === true);
  });

  it('isElectron should be true', () => {
    assert(ProcessIdentifier.isElectron === true);
  });

  it('isElectronMain should be true', () => {
    assert(ProcessIdentifier.isElectronMain === true);
  });

  it('isElectronRenderer should be false', () => {
    assert(ProcessIdentifier.isElectronRenderer === false);
  });

  it('processType should be "Main"', () => {
    assert(ProcessIdentifier.processType === 'Main');
  });
});
