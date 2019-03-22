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

export class LogFileConfig {
    public static config: LogFileConfigState;
    public static configCacheForRenderer: LogFileConfigState | 'unavailable' = 'unavailable';

    public static setup(dirName: string, fileName: string) {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            this.config = new LogFileConfigState(dirName, fileName);
        }
    }

    private static ensureCacheForRenderer() {
        if (this.configCacheForRenderer === 'unavailable') {
            this.configCacheForRenderer = ipcRenderer.sendSync(ipcChannelName);
        }
    }

    public static get dirName(): string {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            return this.config.dirName;
        } else {
            this.ensureCacheForRenderer();
            return (this.configCacheForRenderer as LogFileConfigState).dirName;
        }
    }

    public static get fileName(): string {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            return this.config.fileName;
        } else {
            this.ensureCacheForRenderer();
            return (this.configCacheForRenderer as LogFileConfigState).fileName;
        }
    }

    public static get filePath(): string {
        if (!ProcessUtil.isElectron())
            throw new Error('Use of this method from non-Electron process is not expected.');

        if (ProcessUtil.isElectronMain()) {
            return this.config.filePath;
        } else {
            this.ensureCacheForRenderer();
            return (this.configCacheForRenderer as LogFileConfigState).filePath;
        }
    }
}

if (ProcessUtil.isElectronMain()) {
    ipcMain.on(ipcChannelName, (event, arg) => {
        event.returnValue = LogFileConfig.config;
    });
}
