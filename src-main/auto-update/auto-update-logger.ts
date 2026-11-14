import { Logger as ElectronUpdaterLoggerInterface } from 'electron-updater';
import { LoggedLine } from '../../src-shared/log/logged-line';
import { LogMessage, Logger as PlmLogger } from '../../src-shared/log/logger';

// Note that the logger passed to autoUpdater.logger needs to have the following methods:
// { info(), warn(), error() }
// Also, debug() is actually used for logging "updater cache dir" during downloading the new version.
// Implementing these methods is enforced by ElectronUpdaterLoggerInterface.
// See https://www.electron.build/auto-update

// TL;DR: electron-updater's errors and warnings are logged, not recorded for analytics.
// Details: Its failures are recorded as "Auto-update: Error" (configure-auto-update.ts), and an update that fails for
// want of the network logs several lines each time. The app's own lines that are worth recording use warnRecorded().
class AutoUpdateLogger implements ElectronUpdaterLoggerInterface {
  public error(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.errorNotRecorded(text);
  }

  public warn(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.warnNotRecorded(text);
  }

  /** A warning of the app's own, recorded as Logger.warn records one. */
  public warnRecorded(message: LogMessage): void {
    PlmLogger.warn(this.indicateAutoUpdate(message));
  }

  /** The app's own lines that are not recorded, which say so where they are written: as warn() does. */
  public warnNotRecorded(message: LogMessage): void {
    PlmLogger.warnNotRecorded(this.indicateAutoUpdate(message));
  }

  public info(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.info(text);
  }

  public debug(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.debug(text);
  }

  /**
   * The line with its prefix. electron-updater passes not only texts: its MacUpdater passes the native updater's Error
   * to warn() before it emits the error, so anything but a tagged line is made a text, as the template made it before.
   */
  // noinspection JSMethodCanBeStatic
  private indicateAutoUpdate(text: LogMessage | unknown): LogMessage {
    return text instanceof LoggedLine ? text.prefixed('[auto-update] ') : `[auto-update] ${String(text)}`;
  }
}

export const autoUpdateLogger = new AutoUpdateLogger();
