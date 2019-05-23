import assert = require('assert');
import { ProcessAccessor } from '../../../src-shared/process/process-accessor';

describe('ProcessAccessor (in renderer process in electron-mocha)', () => {
  it('getProcess() should return process', () => {
    assert(ProcessAccessor.getProcess() === process);
  });

  it('window should not be undefined', () => {
    assert(typeof window !== 'undefined');
  });

  it('process.type should be "renderer"', () => {
    // process.type === 'renderer' means renderer process.
    assert(process.type === 'renderer');
  });
});
