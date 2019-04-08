import assert = require('assert');
import { ProcessIdentifier } from '../../../src-shared/process/process-identifier';

describe('ProcessIdentifier (in main process)', () => {
  it('isNode() should return true', () => {
    assert(ProcessIdentifier.isNode() === true);
  });

  it('isElectron() should return true', () => {
    assert(ProcessIdentifier.isElectron() === true);
  });

  it('isElectronMain() should return true', () => {
    assert(ProcessIdentifier.isElectronMain() === true);
  });

  it('isElectronRenderer() should return false', () => {
    assert(ProcessIdentifier.isElectronRenderer() === false);
  });

  it('processType() should return "Main"', () => {
    assert(ProcessIdentifier.processType() === 'Main');
  });
});
