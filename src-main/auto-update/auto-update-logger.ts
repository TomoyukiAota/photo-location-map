import { Logger } from '../../src-shared/log/logger';

export class AutoUpdateLogger {
  public static error(message: string, ...object: any): void {
    const text = AutoUpdateLogger.indicateAutoUpdate(message);
    Logger.error(text, ...object);
  }

  public static warn(message: string, ...object: any): void {
    const text = AutoUpdateLogger.indicateAutoUpdate(message);
    Logger.warn(text, ...object);
  }

  public static info(message: string, ...object: any): void {
    const text = AutoUpdateLogger.indicateAutoUpdate(message);
    Logger.info(text, ...object);
  }

  public static debug(message: string, ...object: any): void {
    const text = AutoUpdateLogger.indicateAutoUpdate(message);
    Logger.debug(text, ...object);
  }

  private static indicateAutoUpdate(text): string {
    return `[auto-update] ${text}`;
  }
}
