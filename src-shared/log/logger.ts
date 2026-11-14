import { Now } from '../date-time/now';
import { EnvironmentDetector } from '../environment/environment-detector';
import { ProcessIdentifier } from '../process/process-identifier';
import { LogFileWriter } from './file-writer/log-file-writer';
import { LoggedLine } from './logged-line';

/** A line of the log: a plain text, or a line made by `logged`, which says what of it may be recorded. */
export type LogMessage = string | LoggedLine;

/** What records the errors and warnings that are logged, for analytics (src-shared/analytics/record-logged-line.ts). */
export type LineRecorder = (level: 'error' | 'warn', message: unknown, args: readonly unknown[]) => void;

let lineRecorder: LineRecorder | undefined;
// Lines logged before the process sets what records them, recorded once it does; at most so many, in case a process
// never does, as a worker thread does not.
const pendingLines: Parameters<LineRecorder>[] = [];
const maxPendingLines = 100;

/**
 * Sets what records this process's errors and warnings, and records those logged before. Each process sets its own
 * (src-main/analytics/analytics-setup.ts, src/analytics-setup.ts), as the logger cannot import analytics, which log.
 */
export function useLineRecorder(recorder: LineRecorder | undefined): void {
  lineRecorder = recorder;
  for (const line of recorder ? pendingLines.splice(0) : [])
    recorder(...line);
}

function recordLine(level: 'error' | 'warn', message: unknown, args: readonly unknown[]): void {
  if (lineRecorder)
    lineRecorder(level, message, args);
  else if (pendingLines.length < maxPendingLines)
    pendingLines.push([level, message, args]);
}

class LoggerImpl {
  public static generateLogText(message: unknown, level: string): string {
    const processType = ProcessIdentifier.processType;
    return `[${Now.extendedFormat}] [${processType}] [${level}] ${message}`;
  }

  public static appendToLogFile(message: string) {
    LogFileWriter.append(message);
  }
}

export class Logger {
  /**
   * Logs an error, and records it for analytics: a line with values is written with the tag `logged`
   * (src-shared/log/logged-line.ts), which the lint checks, so that no value that could name the user's files is sent.
   * The first error among the other arguments is recorded with its stack.
   */
  public static error(message: LogMessage, ...object: any) {
    Logger.errorNotRecorded(message, ...object);
    recordLine('error', message, object);
  }

  /** Logs a warning, and records it for analytics, as error() does. */
  public static warn(message: LogMessage, ...object: any) {
    Logger.warnNotRecorded(message, ...object);
    recordLine('warn', message, object);
  }

  /**
   * Logs an error without recording it: for the analytics code's own lines, which would record their failure to
   * send, and for a line next to an event that records the same failure.
   */
  public static errorNotRecorded(message: LogMessage, ...object: any) {
    const text = LoggerImpl.generateLogText(message, 'error');
    console.error(text, ...object);
    LoggerImpl.appendToLogFile(text);
  }

  /** Logs a warning without recording it, as errorNotRecorded() does. */
  public static warnNotRecorded(message: LogMessage, ...object: any) {
    const text = LoggerImpl.generateLogText(message, 'warn');
    console.warn(text, ...object);
    LoggerImpl.appendToLogFile(text);
  }

  public static info(message: LogMessage, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'info');
    console.info(text, ...object);
    LoggerImpl.appendToLogFile(text);
  }

  public static infoWithoutAppendingFile(message: LogMessage, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'info');
    console.info(text, ...object);
  }

  public static debug(message: LogMessage, ...object: any) {
    if (EnvironmentDetector.isUnitTest)
      return;

    const text = LoggerImpl.generateLogText(message, 'debug');
    console.debug(text, ...object);
    LoggerImpl.appendToLogFile(text);
  }
}
