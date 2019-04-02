import { ProcessUtil } from './process-util';

describe('ProcessUtil', () => {
  it('getProcess() returns window.process (not process)', () => {
    expect(ProcessUtil.getProcess()).toBe(window.process);
    expect(ProcessUtil.getProcess()).not.toBe(process);
  });

  it('window.process.type is "renderer"', () => {
    expect(window.process.type).toEqual('renderer');
  });

  it('process.type is undefined', () => {
    expect(process.type).toBeUndefined();
  });
});
