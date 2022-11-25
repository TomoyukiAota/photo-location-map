import { EnvironmentDetector } from '../../environment/environment-detector';
import { ProcessIdentifier } from '../../process/process-identifier';
import { LogFileWriterInterface } from './log-file-writer-interface';
import { logFileWriterMain } from './log-file-writer-main';
import { logFileWriterRenderer } from './log-file-writer-renderer';

let logFileWriter: Promise<LogFileWriterInterface>;

function initializeLogFileWriter() {
  if (EnvironmentDetector.isUnitTest)
    return;

  if (ProcessIdentifier.isElectronMain) {
    logFileWriter = logFileWriterMain;
  } else {
    logFileWriter = logFileWriterRenderer;
  }
}

export class LogFileWriter {
  public static async append(message: string): Promise<void> {
    if (EnvironmentDetector.isUnitTest)
      return;

    const fileWriter = await logFileWriter;
    await fileWriter.append(message);
  }
}

initializeLogFileWriter();
