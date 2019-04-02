import { ProcessUtil } from './process-util';

describe('ProcessUtil', () => {
  it('getProcess() should return window.process (not process)', () => {
    expect(ProcessUtil.getProcess()).toBe(window.process);
    expect(ProcessUtil.getProcess()).not.toBe(process);
  });

  it('window.process.type should be "renderer"', () => {
    expect(window.process.type).toEqual('renderer');
  });

  it('process.type should be undefined', () => {
    expect(process.type).toBeUndefined();
  });
});
