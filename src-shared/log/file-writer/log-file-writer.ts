import { plmBridge } from '../../bridge/plm-bridge.js';
import { EnvironmentDetector } from '../../environment/environment-detector.js';
import { ProcessIdentifier } from '../../process/process-identifier.js';
import { LogFileWriterInterface } from './log-file-writer-interface.js';

let logFileWriter: LogFileWriterInterface | undefined;

/** Sets the writer of the main process, which writes the file itself (src-main/log/). */
export function useLogFileWriter(writer: LogFileWriterInterface): void {
  logFileWriter = writer;
}

/** A renderer's writer, which sends each line to the main process through its preload's bridge. */
const rendererWriter: LogFileWriterInterface = {
  append: async message => plmBridge()?.log.append(message),
};

export class LogFileWriter {
  /** Appends `message` to the log file; as the logger does not wait for it, a failure is reported on the console. */
  public static async append(message: string): Promise<void> {
    if (EnvironmentDetector.isUnitTest)
      return;

    if (!logFileWriter && ProcessIdentifier.isElectronRenderer)
      logFileWriter = rendererWriter;
    try {
      await logFileWriter?.append(message);
    } catch (error) {
      // The logger does not wait for the file (src-shared/log/logger.ts), so a failure would go unhandled otherwise.
      console.error('A line could not be written to the log file.', error);
    }
  }
}
