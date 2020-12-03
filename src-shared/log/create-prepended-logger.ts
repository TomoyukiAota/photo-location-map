import { Logger } from './logger';

class PrependedLogger {
  constructor(private stringToPrepend: string) {
  }

  public error(message: string, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    Logger.error(text, ...object);
  }

  public warn(message: string, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    Logger.warn(text, ...object);
  }

  public info(message: string, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    Logger.info(text, ...object);
  }

  public debug(message: string, ...object: any): void {
    const text = this.prependSpecifiedString(message);
    Logger.debug(text, ...object);
  }

  private prependSpecifiedString(message: string): string {
    return `${this.stringToPrepend} ${message}`;
  }
}

export function createPrependedLogger(stringToPrepend: string) {
  return new PrependedLogger(stringToPrepend);
}
