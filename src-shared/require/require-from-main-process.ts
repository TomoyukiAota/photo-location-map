import { ProcessIdentifier } from '../process/process-identifier';

export class RequireFromMainProcess {
  public static fsExtra: typeof import ('fs-extra') = null;
  public static electron: typeof import('electron') = null;
  public static os: typeof import('os') = null;
  public static path: typeof import('path') = null;

  public static initialize() {
    if (!ProcessIdentifier.isElectron)
      return;

    if (ProcessIdentifier.isElectronMain) {
      // For Electron main process, use global.require function.
      this.fsExtra = require('fs-extra');
      this.electron = require('electron');
      this.os = require('os');
      this.path = require('path');
    } else {
      // For Electron renderer process, use window.require('@electron/remote').require function.
      const remote = window.require('@electron/remote');
      this.fsExtra = remote.require('fs-extra');
      this.electron = remote.require('electron');
      this.os = remote.require('os');
      this.path = remote.require('path');
    }
  }
}

RequireFromMainProcess.initialize();
