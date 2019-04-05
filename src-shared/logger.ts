import { EnvironmentDetector } from './environment-detector';
import { LogFileConfig } from './log-file-config';
import { Now } from './date-time/now';
import { ProcessIdentifier } from './process/process-identifier';

class LoggerImpl {
    private static readonly unavailableStr = 'unavailable';
    private static fs: any = LoggerImpl.unavailableStr;
    private static os: any = LoggerImpl.unavailableStr;

    public static initialize() {
        if (ProcessIdentifier.isElectron()) {
            if (ProcessIdentifier.isElectronMain()) {
                LogFileConfig.setup('./log', `${Now.basicFormat}_photo-location-map_log.txt`);
                this.fs = require('fs-extra');
                this.fs.ensureFileSync(LogFileConfig.filePath);
                this.os = require('os');
            } else {
                const remote: Electron.Remote = window.require('electron').remote;
                this.fs = remote.require('fs-extra');
                this.os = remote.require('os');
            }
        }
    }

    public static generateLogText(message: string, level: string): string {
        const processType = ProcessIdentifier.processType();
        return `[${Now.extendedFormat}] [${processType}] [${level}] ${message}`;
    }

    public static appendToLogFile(message: string, ...object: any) {
        if (EnvironmentDetector.isUnitTest())
            return;

        if (this.fs === this.unavailableStr || this.os === this.unavailableStr) {
            // Do nothing because APIs required for writing to file are unavailable.
        } else {
            this.fs.appendFile(LogFileConfig.filePath, message + this.os.EOL, (err) => {
                if (err) throw err;
            });
        }
    }
}

LoggerImpl.initialize();

export class Logger {
    public static error(message: string, ...object: any) {
        const text = LoggerImpl.generateLogText(message, 'error');
        console.error(text, ...object);
        LoggerImpl.appendToLogFile(text, ...object);
    }

    public static warn(message: string, ...object: any) {
        const text = LoggerImpl.generateLogText(message, 'warn');
        console.warn(text, ...object);
        LoggerImpl.appendToLogFile(text, ...object);
    }

    public static info(message: string, ...object: any) {
        if (EnvironmentDetector.isUnitTest())
            return;

        const text = LoggerImpl.generateLogText(message, 'info');
        console.info(text, ...object);
        LoggerImpl.appendToLogFile(text, ...object);
    }

    public static debug(message: string, ...object: any) {
        if (EnvironmentDetector.isUnitTest())
            return;

        const text = LoggerImpl.generateLogText(message, 'debug');
        console.debug(text, ...object);
        LoggerImpl.appendToLogFile(text, ...object);
    }
}
