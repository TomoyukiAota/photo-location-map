import { ProcessIdentifier } from '../process/process-identifier';

export class ConditionalRequire {
  public static electron: typeof import('electron') = null;
  public static os: typeof import('os') = null;

  public static initialize() {
    if (!ProcessIdentifier.isElectron())
      return;

    if (ProcessIdentifier.isElectronMain()) {
      // For Electron main process, use global.require function.
      this.electron = require('electron');
      this.os = require('os');
    } else {
      // For Electron renderer process, use window.require function.
      this.electron = window.require('electron');
      this.os = window.require('os');
    }
  }
}

ConditionalRequire.initialize();
