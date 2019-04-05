import { ProcessAccessor } from './process-accessor';

describe('ProcessAccessor', () => {
  it('getProcess() should return window.process (not process)', () => {
    expect(ProcessAccessor.getProcess()).toBe(window.process);
    expect(ProcessAccessor.getProcess()).not.toBe(process);
  });

  it('window.process.type should be "renderer"', () => {
    expect(window.process.type).toEqual('renderer');
  });

  it('process.type should be undefined', () => {
    expect(process.type).toBeUndefined();
  });
});
