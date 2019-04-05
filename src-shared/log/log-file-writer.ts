import { EnvironmentDetector } from '../environment-detector';
import { LogFileConfig } from './log-file-config';
import { ProcessIdentifier } from '../process/process-identifier';

export class LogFileWriter {
  private fs: any = null;
  private os: any = null;

  constructor() {
    if (ProcessIdentifier.isElectron()) {
      if (ProcessIdentifier.isElectronMain()) {
        this.fs = require('fs-extra');
        this.fs.ensureFileSync(LogFileConfig.filePath);
        this.os = require('os');
      } else {
        const remote: Electron.Remote = window.require('electron').remote;
        this.fs = remote.require('fs-extra');
        this.os = remote.require('os');
      }
    }
  }

  public append(message: string, ...object: any) {
    if (EnvironmentDetector.isUnitTest())
      return;

    if (this.fs === null || this.os === null) {
      // Do nothing because APIs required for writing to file are unavailable.
    } else {
      this.fs.appendFile(LogFileConfig.filePath, message + this.os.EOL, (err) => {
        if (err) throw err;
      });
    }
  }
}
