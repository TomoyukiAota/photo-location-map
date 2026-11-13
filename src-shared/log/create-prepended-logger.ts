import { LoggedLine } from './logged-line';
import { LogMessage, Logger } from './logger';

export interface PrependedLoggerOptions {
  /**
   * Whether its errors and warnings are recorded for analytics, as Logger's are. False for the analytics code's own
   * loggers, which would record their failure to send.
   */
  readonly recorded?: boolean;
}

export class PrependedLogger {
  private readonly recorded: boolean;

  constructor(private stringToPrepend: string, options: PrependedLoggerOptions = {}) {
    this.recorded = options.recorded ?? true;
  }

  public error(message: LogMessage, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    if (this.recorded)
      Logger.error(text, ...object);
    else
      Logger.errorNotRecorded(text, ...object);
  }

  public warn(message: LogMessage, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    if (this.recorded)
      Logger.warn(text, ...object);
    else
      Logger.warnNotRecorded(text, ...object);
  }

  /** Logs an error without recording it: for a line next to an event that records the same failure. */
  public errorNotRecorded(message: LogMessage, ...object: any): void {
    Logger.errorNotRecorded(this.prependSpecifiedString(message), ...object);
  }

  /** Logs a warning without recording it, as errorNotRecorded() does. */
  public warnNotRecorded(message: LogMessage, ...object: any): void {
    Logger.warnNotRecorded(this.prependSpecifiedString(message), ...object);
  }

  public info(message: LogMessage, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    Logger.info(text, ...object);
  }

  public debug(message: LogMessage, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    Logger.debug(text, ...object);
  }

  private prependSpecifiedString(message: LogMessage): LogMessage {
    return message instanceof LoggedLine ? message.prefixed(`${this.stringToPrepend} `) : `${this.stringToPrepend} ${message}`;
  }
}

export function createPrependedLogger(stringToPrepend: string, options?: PrependedLoggerOptions) {
  return new PrependedLogger(stringToPrepend, options);
}
