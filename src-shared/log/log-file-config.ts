import { ProxyRequire } from '../require/proxy-require';
import { Now } from '../date-time/now';
import { ProcessIdentifier } from '../process/process-identifier';

const ipcChannelName = 'get-log-file-config-from-main';
const pathSep = ProxyRequire.path.sep;

class LogFileConfigState {
  public dirName: string;
  public fileName: string;
  public filePath: string;

  constructor(dirName: string, fileName: string) {
    this.dirName = dirName;
    this.fileName = fileName;
    this.filePath = `${dirName}${pathSep}${fileName}`;
  }
}

/**
 * Handler of LogFileConfigState to ensure that
 *  - LogFileConfigState is initialized only once.
 *  - LogFileConfigState can be gotten after initialization.
 */
class LogFileConfigStateHandler {
  private logFileConfigState: LogFileConfigState | 'uninitialized' = 'uninitialized';

  public isInitialized(): boolean {
    return this.logFileConfigState !== 'uninitialized';
  }

  public initialize(logFileConfigState: LogFileConfigState) {
    if (this.logFileConfigState === 'uninitialized') {
      this.logFileConfigState = logFileConfigState;
    } else {
      throw new Error('LogFileConfigStateHandler is already initalized and cannot be initialized more than once.');
    }
  }

  public get(): LogFileConfigState {
    if (this.logFileConfigState === 'uninitialized') {
      throw new Error('LogFileConfigStateHandler is NOT initialized yet and cannot be gotten before initialization.');
    } else {
      return this.logFileConfigState;
    }
  }
}

export class LogFileConfig {
  public static config = new LogFileConfigStateHandler();
  public static configCacheForRenderer = new LogFileConfigStateHandler();

  public static setup(dirName: string, fileName: string) {
    if (ProcessIdentifier.isElectronMain) {
      this.config.initialize(new LogFileConfigState(dirName, fileName));
    } else {
      throw new Error('LogFileConfig can be set up from Electron main process only.');
    }
  }

  private static ensureCacheForRenderer() {
    if (!this.configCacheForRenderer.isInitialized()) {
      const configFromMain: LogFileConfigState = ProxyRequire.electron.ipcRenderer.sendSync(ipcChannelName);
      this.configCacheForRenderer.initialize(configFromMain);
    }
  }

  private static getConfigCacheForRenderer(): LogFileConfigState {
    this.ensureCacheForRenderer();
    return this.configCacheForRenderer.get();
  }

  public static get dirName(): string {
    if (!ProcessIdentifier.isElectron)
      throw new Error('Use of this method from non-Electron process is not expected.');

    return ProcessIdentifier.isElectronMain
      ? this.config.get().dirName
      : this.getConfigCacheForRenderer().dirName;
  }

  public static get fileName(): string {
    if (!ProcessIdentifier.isElectron)
      throw new Error('Use of this method from non-Electron process is not expected.');

    return ProcessIdentifier.isElectronMain
      ? this.config.get().fileName
      : this.getConfigCacheForRenderer().fileName;
  }

  public static get filePath(): string {
    if (!ProcessIdentifier.isElectron)
      throw new Error('Use of this method from non-Electron process is not expected.');

    return ProcessIdentifier.isElectronMain
      ? this.config.get().filePath
      : this.getConfigCacheForRenderer().filePath;
  }
}

class LogFileConfigSetup {
  private static setupIpcChannelListnerInMainProcess() {
    ProxyRequire.electron.ipcMain.on(ipcChannelName, (event, arg) => {
      event.returnValue = LogFileConfig.config.get();
    });
  }

  private static setupLogFileConfig() {
    const appDataDirectory = ProxyRequire.electron.app.getPath('appData');
    const logDirectory = `${appDataDirectory}${pathSep}Photo Location Map${pathSep}logs`;
    const fileName = `${Now.basicFormat}_photo-location-map_log.txt`;
    LogFileConfig.setup(logDirectory, fileName);
  }

  public static setup() {
    this.setupIpcChannelListnerInMainProcess();
    this.setupLogFileConfig();
  }
}

if (ProcessIdentifier.isElectronMain) {
  LogFileConfigSetup.setup();
}
