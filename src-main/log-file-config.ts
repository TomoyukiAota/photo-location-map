import { ipcRenderer, ipcMain } from 'electron';
import { ProcessUtil } from '../src-shared/process-util';

const ipcChannelName = 'get-log-file-config-from-main';

class LogFileConfigState {
    public dirName: string;
    public fileName: string;
    public filePath: string;

    constructor(dirName: string, fileName: string) {
        this.dirName = dirName;
        this.fileName = fileName;
        this.filePath = `${dirName}/${fileName}`;
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
        if (ProcessUtil.isElectronMain()) {
            this.config.initialize(new LogFileConfigState(dirName, fileName));
        } else {
            throw new Error('LogFileConfig can be set up from Electron main process only.');
        }
    }

    private static ensureCacheForRenderer() {
        if (!this.configCacheForRenderer.isInitialized()) {
            const configFromMain: LogFileConfigState = ipcRenderer.sendSync(ipcChannelName);
            this.configCacheForRenderer.initialize(configFromMain);
        }
    }

    private static getConfigCacheForRenderer(): LogFileConfigState {
        this.ensureCacheForRenderer();
        return this.configCacheForRenderer.get();
    }

    public static get dirName(): string {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            return this.config.get().dirName;
        } else {
            return this.getConfigCacheForRenderer().dirName;
        }
    }

    public static get fileName(): string {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            return this.config.get().fileName;
        } else {
            return this.getConfigCacheForRenderer().fileName;
        }
    }

    public static get filePath(): string {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            return this.config.get().filePath;
        } else {
            return this.getConfigCacheForRenderer().filePath;
        }
    }
}

if (ProcessUtil.isElectronMain()) {
    ipcMain.on(ipcChannelName, (event, arg) => {
        event.returnValue = LogFileConfig.config.get();
    });
}
