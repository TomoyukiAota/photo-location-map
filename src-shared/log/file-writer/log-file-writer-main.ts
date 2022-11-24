import * as fsExtra from 'fs-extra';
import { ProcessIdentifier } from '../../process/process-identifier';
import { RequireFromMainProcess } from '../../require/require-from-main-process';
import { LogFileConfig } from '../log-file-config';
import { LogFileWriterInterface } from './log-file-writer-interface';
import { LogFileWriterIpcMain } from './log-file-writer-ipc';

class LogFileWriterMain implements LogFileWriterInterface {
  private fsExtra = RequireFromMainProcess.fsExtra;
  private os = RequireFromMainProcess.os;
  private fileHandle: fsExtra.promises.FileHandle;

  private constructor() { /* Empty by design. Call create function instead. */ }

  public static async create(): Promise<LogFileWriterMain> {
    const logFileWriter = new LogFileWriterMain();
    const fileSystemFlag = 'a'; // 'a' is for "Open file for appending. The file is created if it does not exist." See https://nodejs.org/api/fs.html
    logFileWriter.fileHandle = await logFileWriter.fsExtra.promises.open(LogFileConfig.filePath, fileSystemFlag);
    return logFileWriter;
  }

  public append(message: string): Promise<void> {
    return this.fileHandle.appendFile(message + this.os.EOL);
  }
}

export let logFileWriterMain: Promise<LogFileWriterMain>;

if (ProcessIdentifier.isElectronMain) {
  logFileWriterMain = LogFileWriterMain.create();
  LogFileWriterIpcMain.configureReceivingIpcFromRenderer();
}
