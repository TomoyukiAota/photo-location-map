export class ProcessIdentifier {
    //                   |  process  | process.type
    // ------------------+-----------+----------------
    // Non-Node.js       | undefined |    N/A
    // Node.js           |   defined |   defined in Electron. Otherwise, undefined.
    // Electron          |   defined |   defined (either "renderer" or "browser")
    // Electron Renderer |   defined | "renderer"
    // Electron Main     |   defined |  "browser"

    public static getProcess(): NodeJS.Process {
        return (typeof process !== 'undefined')
            ? process           // In Node.js, process is defined, so it is returned.
            : window.process;   // In tests run by Karma, process is undefined but window.process is defined (This is weird but happens!), so it is returned.
    }

    public static isNode(): boolean {
        return (typeof this.getProcess() !== 'undefined');
    }

    public static isElectron(): boolean {
        return this.isNode()
            && (typeof this.getProcess().type !== 'undefined');
    }

    public static isElectronMain(): boolean {
        return this.isElectron()
            && (this.getProcess().type === 'browser');
    }

    public static isElectronRenderer(): boolean {
        return this.isElectron()
            && (this.getProcess().type === 'renderer');
    }

    public static processType(): 'Renderer' | 'Main' | 'Node' | 'Non-Node' {
        if (this.isElectronRenderer())
            return 'Renderer';

        if (this.isElectronMain())
            return 'Main';

        if (this.isNode())
            return 'Node';

        return 'Non-Node';
    }
}
