import { RequireFromMainProcess } from './require-from-main-process';

describe('RequireFromMainProcess (in renderer process)', () => {
  it('fsExtra should not be null', () => {
    expect(RequireFromMainProcess.fsExtra).not.toBeNull();
  });

  it('fsExtra should return window.require("electron").remote.require("fs-extra")', () => {
    expect(RequireFromMainProcess.fsExtra).toBe(window.require('electron').remote.require('fs-extra'));
  });

  it('os should not be null', () => {
    expect(RequireFromMainProcess.os).not.toBeNull();
  });

  it('os should return window.require("electron").remote.require("os")', () => {
    expect(RequireFromMainProcess.os).toBe(window.require('electron').remote.require('os'));
  });
});
