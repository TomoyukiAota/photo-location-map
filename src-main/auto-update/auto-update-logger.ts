import { Logger as ElectronUpdaterLoggerInterface } from 'electron-updater';
import { Logger as PlmLogger } from '../../src-shared/log/logger';

// Note that the logger passed to autoUpdater.logger needs to have the following methods:
// { info(), warn(), error() }
// Also, debug() is actually used for logging "updater cache dir" during downloading the new version.
// Implementing these methods is enforced by ElectronUpdaterLoggerInterface.
// See https://www.electron.build/auto-update

class AutoUpdateLogger implements ElectronUpdaterLoggerInterface {
  public error(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.error(text);
  }

  public warn(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.warn(text);
  }

  public info(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.info(text);
  }

  public debug(message: string): void {
    const text = this.indicateAutoUpdate(message);
    PlmLogger.debug(text);
  }

  // noinspection JSMethodCanBeStatic
  private indicateAutoUpdate(text): string {
    return `[auto-update] ${text}`;
  }
}

export const autoUpdateLogger = new AutoUpdateLogger();
