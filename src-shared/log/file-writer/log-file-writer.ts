import { plmBridge } from '../../bridge/plm-bridge';
import { EnvironmentDetector } from '../../environment/environment-detector';
import { ProcessIdentifier } from '../../process/process-identifier';
import { LogFileWriterInterface } from './log-file-writer-interface';

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
  public static async append(message: string): Promise<void> {
    if (EnvironmentDetector.isUnitTest)
      return;

    if (!logFileWriter && ProcessIdentifier.isElectronRenderer)
      logFileWriter = rendererWriter;
    await logFileWriter?.append(message);
  }
}
