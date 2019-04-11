import assert = require('assert');
import { ProcessAccessor } from '../../../src-shared/process/process-accessor';

describe('ProcessAccessor (in main process in electron-mocha)', () => {
  it('getProcess() should return process (not window.process)', () => {
    assert(ProcessAccessor.getProcess() === process);
  });

  it('window should be undefined', () => {
    assert(typeof window === 'undefined');
  });

  it('process.type should be "browser"', () => {
    // process.type === 'browser' means main process.
    assert(process.type === 'browser');
  });
});
