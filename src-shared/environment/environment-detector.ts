export class EnvironmentDetector {
  public static get isKarma(): boolean {
    return typeof __karma__ !== 'undefined';
  }

  public static get isElectronMochaMain(): boolean {
    return !!process.env.PLM_EM_MAIN;
  }

  public static get isElectronMochaRenderer(): boolean {
    return !!process.env.PLM_EM_RENDERER;
  }

  public static get isUnitTest(): boolean {
    return this.isKarma || this.isElectronMochaMain || this.isElectronMochaRenderer;
  }
}
