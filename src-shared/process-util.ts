import { EnvironmentDetector } from './environment-detector';

export class ProcessUtil {
    public static getProcess(): NodeJS.Process {
        // In Karma, process variable is overridden like following:
        // "{"title":"browser","browser":true,"env":{},"argv":[],"version":"","versions":{}}'"
        // window.process is kept the same as the one from Electron, so use window.process for Karma.
        // Also, Karma is for tests on Electron renderer process, so window variable must exist.
        // In cases other than Karma, process variable exists both on main and renderer process.

        return EnvironmentDetector.isKarma()
            ? window.process
            : process;
    }
}
