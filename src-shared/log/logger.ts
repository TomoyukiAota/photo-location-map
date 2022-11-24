import { Now } from '../date-time/now';
import { EnvironmentDetector } from '../environment/environment-detector';
import { ProcessIdentifier } from '../process/process-identifier';
import { LogFileWriter } from './file-writer/log-file-writer';

class LoggerImpl {
  public static generateLogText(message: string, level: string): string {
    const processType = ProcessIdentifier.processType;
    return `[${Now.extendedFormat}] [${processType}] [${level}] ${message}`;
  }

  public static appendToLogFile(message: string) {
    LogFileWriter.append(message);
  }
}

export class Logger {
  public static error(message: string, ...object: any) {
    const text = LoggerImpl.generateLogText(message, 'error');
    console.error(text, ...object);
    LoggerImpl.appendToLogFile(text);
  }

  public static warn(message: string, ...object: any) {
    const text = LoggerImpl.generateLogText(message, 'warn');
    console.warn(text, ...object);
    LoggerImpl.appendToLogFile(text);
  }

  public static info(message: string, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'info');
    console.info(text, ...object);
    LoggerImpl.appendToLogFile(text);
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
    LoggerImpl.appendToLogFile(text);
  }
}
