import assert from 'assert';
import { ProcessAccessor } from '../../../src-shared/process/process-accessor.js';

// electron-mocha's renderer page has Node.js, unlike the app's main window (src-shared/process/process-identifier.ts).
const pageProcess = () => (window as Window & { process?: NodeJS.Process }).process;

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

  it('process and window.process should refer to the same object', () => {
    assert.equal(process, pageProcess());
  });

  it('getProcess() and window.process should refer to the same object', () => {
    assert.equal(ProcessAccessor.getProcess(), pageProcess());
  });

  it('window.process.type should be "renderer"', () => {
    assert.equal(pageProcess().type, 'renderer');
  });
});
