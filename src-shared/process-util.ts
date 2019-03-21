export class ProcessUtil {
    public static isElectron(): boolean {
        //             |  process  | process.type
        // ------------+-----------+----------------
        // Web browser | undefined |     N/A
        // Node.js     |   defined | undefined
        // Electron    |   defined |   defined (either 'renderer' or 'browser')
        return (typeof process !== 'undefined') && (typeof process.type !== 'undefined');
    }

    public static isElectronRenderer(): boolean {
        return this.isElectron() && process.type === 'renderer';
    }

    public static isElectronMain(): boolean {
        return this.isElectron() && process.type === 'browser';
    }

    public static processType(): 'non-Electron' | 'renderer' | 'main' {
        if (!this.isElectron())
            return 'non-Electron';

        return this.isElectronRenderer() ? 'renderer' : 'main';
    }
}
