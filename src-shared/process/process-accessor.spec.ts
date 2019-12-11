import { ProcessAccessor } from './process-accessor';

describe('ProcessAccessor (in renderer process in Karma)', () => {
  it('process and window.process should refer to the same object', () => {
    expect(process).toBe(window.process);
  });

  it('the object returned from getProcess() and process should refer to the same object', () => {
    expect(ProcessAccessor.getProcess()).toBe(process);
  });

  it('the object returned from getProcess() and window.process should refer to the same object', () => {
    expect(ProcessAccessor.getProcess()).toBe(window.process);
  });

  it('process.type should be "renderer"', () => {
    expect(process.type).toEqual('renderer');
  });

  it('window.process.type should be "renderer"', () => {
    expect(window.process.type).toEqual('renderer');
  });
});
