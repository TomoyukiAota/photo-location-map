import { EnvironmentDetector } from '../environment/environment-detector';
import { LogFileConfig } from './log-file-config';
import { ProcessIdentifier } from '../process/process-identifier';
import { RequireFromMainProcess } from '../require/require-from-main-process';

export class LogFileWriter {
  private fsExtra = RequireFromMainProcess.fsExtra;
  private os = RequireFromMainProcess.os;

  constructor() {
    if (ProcessIdentifier.isElectronMain) {
      this.fsExtra.ensureFileSync(LogFileConfig.filePath);
    }
  }

  public append(message: string, ...object: any): Promise<void> {
    // Renderer process needs IPC channel setup in main process to write logs to the log file.
    // In unit test, the IPC channel is not available.
    if (EnvironmentDetector.isUnitTest && ProcessIdentifier.isElectronRenderer)
      return Promise.reject();

    const isApiAvailable = (this.fsExtra !== null && this.os !== null);
    return isApiAvailable
         ? this.fsExtra.promises.appendFile(LogFileConfig.filePath, message + this.os.EOL)
         : Promise.reject();
  }
}
