import { ProcessAccessor } from './process-accessor';

export class ProcessIdentifier {
  //                   |  process  | process.type
  // ------------------+-----------+----------------
  // Non-Node.js       | undefined |    N/A
  // Node.js           |   defined |   defined in Electron. Otherwise, undefined.
  // Electron          |   defined |   defined (either "renderer" or "browser")
  // Electron Renderer |   defined | "renderer"
  // Electron Main     |   defined |  "browser"

  private static readonly process = ProcessAccessor.getProcess();

  public static get isNode(): boolean {
    return (typeof this.process !== 'undefined');
  }

  public static get isElectron(): boolean {
    return this.isNode
        && (typeof this.process.type !== 'undefined');
  }

  public static get isElectronMain(): boolean {
    return this.isElectron
        && (this.process.type === 'browser');
  }

  public static isElectronRenderer(): boolean {
    return this.isElectron
        && (this.process.type === 'renderer');
  }

  public static processType(): 'Renderer' | 'Main' | 'Node' | 'Non-Node' {
    if (this.isElectronRenderer())
      return 'Renderer';

    if (this.isElectronMain)
      return 'Main';

    if (this.isNode)
      return 'Node';

    return 'Non-Node';
  }
}
