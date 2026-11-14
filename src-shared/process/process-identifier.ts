import { ProcessAccessor } from './process-accessor.js';

export class ProcessIdentifier {
  //                   |  process  | process.type | window.plm
  // ------------------+-----------+--------------+-----------
  // Non-Node.js       | undefined |    N/A       | undefined
  // Node.js           |   defined |   undefined  | (only a test double, in Vitest)
  // Electron Renderer |   defined | "renderer"   | (the preload's, in electron-mocha's renderer tests)
  // Electron Main     |   defined |  "browser"   |    N/A
  // The main window   | undefined |    N/A       |   defined
  // The main window's page has no Node.js, so no process: it runs sandboxed, with context isolation. Its preload's
  // bridge, window.plm, tells it apart (electron-util/preload/main-window.cjs).

  private static readonly process = ProcessAccessor.getProcess();

  public static get isNode(): boolean {
    return (typeof this.process !== 'undefined');
  }

  /** Whether this is a page with the main window's bridge, as the app's isolated page is. */
  private static get hasBridge(): boolean {
    return typeof window !== 'undefined' && !!window.plm;
  }

  /** Whether this runs in Electron: by the process's type with Node.js, by the bridge in the isolated page. */
  public static get isElectron(): boolean {
    return this.isNode ? typeof this.process.type !== 'undefined' : this.hasBridge;
  }

  /** Whether this is Electron's main process. */
  public static get isElectronMain(): boolean {
    return this.isNode && this.process.type === 'browser';
  }

  /** Whether this is an Electron renderer: by the process's type with Node.js, by the bridge in the isolated page. */
  public static get isElectronRenderer(): boolean {
    return this.isNode ? this.process.type === 'renderer' : this.hasBridge;
  }

  public static get processType(): 'Renderer' | 'Main' | 'Node' | 'Non-Node' {
    if (this.isElectronRenderer)
      return 'Renderer';

    if (this.isElectronMain)
      return 'Main';

    if (this.isNode)
      return 'Node';

    return 'Non-Node';
  }
}
