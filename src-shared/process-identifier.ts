export class ProcessIdentifier {
    //                   |  process  | process.type
    // ------------------+-----------+----------------
    // Non-Node.js       | undefined |    N/A
    // Node.js           |   defined | undefined
    // Electron          |   defined |   defined (either "renderer" or "browser")
    // Electron Renderer |   defined | "renderer"
    // Electron Main     |   defined |  "browser"

    public static isNode(): boolean {
        return (typeof process !== 'undefined')
            && (typeof process.versions.node !== 'undefined');  // Check process.versions.node in case of process variable unexpectedly defined in global scope.
    }

    public static isElectron(): boolean {
        return this.isNode() && (typeof process.type !== 'undefined');
    }

    public static isElectronMain(): boolean {
        return this.isElectron() && process.type === 'browser';
    }

    public static isElectronRenderer(): boolean {
        return this.isElectron() && process.type === 'renderer';
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
