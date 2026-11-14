import { ProcessIdentifier } from '../../process/process-identifier.js';
import { startupMetadata } from '../../startup/startup-metadata.js';

interface LogFileConfigState {
  dirName: string;
  fileName: string;
  filePath: string;
}

/**
 * Where the log file is. The main process decides at its start (src-main/log/); a renderer gets it with the startup
 * metadata (src-shared/startup/).
 */
export class LogFileConfig {
  private static config: LogFileConfigState | undefined;

  /** Sets where the log file is, once, in the main process only. */
  public static setup(dirName: string, fileName: string, pathSeparator: string) {
    if (!ProcessIdentifier.isElectronMain)
      throw new Error('LogFileConfig can be set up from Electron main process only.');
    if (this.config)
      throw new Error('LogFileConfig is already set up and cannot be set up more than once.');
    this.config = { dirName, fileName, filePath: `${dirName}${pathSeparator}${fileName}` };
  }

  /** Where the log file is: as the main process set it up, or, in a renderer, as its startup metadata says. */
  private static get state(): LogFileConfigState {
    if (!ProcessIdentifier.isElectron)
      throw new Error('Use of this method from non-Electron process is not expected.');
    if (ProcessIdentifier.isElectronMain) {
      if (!this.config)
        throw new Error('LogFileConfig is NOT set up yet and cannot be read before it is (src-main/log/).');
      return this.config;
    }
    return startupMetadata().logFile;
  }

  public static get dirName(): string {
    return this.state.dirName;
  }

  public static get fileName(): string {
    return this.state.fileName;
  }

  public static get filePath(): string {
    return this.state.filePath;
  }
}
