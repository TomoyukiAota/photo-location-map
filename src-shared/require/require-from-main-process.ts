import { ProcessIdentifier } from '../process/process-identifier';

export class RequireFromMainProcess {
  public static fsExtra: typeof import ('fs-extra') = null;
  public static os: typeof import('os') = null;

  public static initialize() {
    if (!ProcessIdentifier.isElectron)
      return;

    if (ProcessIdentifier.isElectronMain()) {
      // For Electron main process, use global.require function.
      this.fsExtra = require('fs-extra');
      this.os = require('os');
    } else {
      // For Electron renderer process, use window.require('electron').remote.require function.
      const remote = window.require('electron').remote;
      this.fsExtra = remote.require('fs-extra');
      this.os = remote.require('os');
    }
  }
}

RequireFromMainProcess.initialize();
