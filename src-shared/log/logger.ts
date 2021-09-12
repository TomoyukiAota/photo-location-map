import { EnvironmentDetector } from '../environment/environment-detector';
import { Now } from '../date-time/now';
import { ProcessIdentifier } from '../process/process-identifier';
import { LogFileWriter } from './log-file-writer';

class LoggerImpl {
  private static logFileWriter = new LogFileWriter();

  public static generateLogText(message: string, level: string): string {
    const processType = ProcessIdentifier.processType;
    return `[${Now.extendedFormat}] [${processType}] [${level}] ${message}`;
  }

  public static appendToLogFile(message: string, ...object: any) {
    this.logFileWriter.append(message, ...object);
  }
}

export class Logger {
  public static error(message: string, ...object: any) {
    const text = LoggerImpl.generateLogText(message, 'error');
    console.error(text, ...object);
    LoggerImpl.appendToLogFile(text, ...object);
  }

  public static warn(message: string, ...object: any) {
    const text = LoggerImpl.generateLogText(message, 'warn');
    console.warn(text, ...object);
    LoggerImpl.appendToLogFile(text, ...object);
  }

  public static info(message: string, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'info');
    console.info(text, ...object);
    LoggerImpl.appendToLogFile(text, ...object);
  }

  public static infoWithoutAppendingFile(message: string, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'info');
    console.info(text, ...object);
  }

  public static debug(message: string, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'debug');
    console.debug(text, ...object);
    LoggerImpl.appendToLogFile(text, ...object);
  }
}
