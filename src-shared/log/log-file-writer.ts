import { EnvironmentDetector } from '../environment/environment-detector';
import { LogFileConfig } from './log-file-config';
import { ProcessIdentifier } from '../process/process-identifier';
import { RequireFromMainProcess } from '../require/require-from-main-process';

export class LogFileWriter {
  private fsExtra = RequireFromMainProcess.fsExtra;
  private os = RequireFromMainProcess.os;

  constructor() {
    if (ProcessIdentifier.isElectronMain()) {
      this.fsExtra.ensureFileSync(LogFileConfig.filePath);
    }
  }

  public append(message: string, ...object: any) {
    if (EnvironmentDetector.isUnitTest())
      return;

    if (this.fsExtra === null || this.os === null) {
      // Do nothing because APIs required for writing to file are unavailable.
    } else {
      this.fsExtra.appendFile(LogFileConfig.filePath, message + this.os.EOL, (err) => {
        if (err)
          throw err;
      });
    }
  }
}
