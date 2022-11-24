import { ProcessIdentifier } from '../../process/process-identifier';
import { LogFileWriterInterface } from './log-file-writer-interface';
import { LogFileWriterIpcRenderer } from './log-file-writer-ipc';

class LogFileWriterRenderer implements LogFileWriterInterface {
  public async append(message: string): Promise<void> {
    LogFileWriterIpcRenderer.sendEventToMain(message);
  }
}

export let logFileWriterRenderer: Promise<LogFileWriterRenderer>;

if (ProcessIdentifier.isElectronRenderer) {
  logFileWriterRenderer = Promise.resolve(new LogFileWriterRenderer());
}
