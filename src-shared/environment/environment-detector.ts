export class EnvironmentDetector {
  public static get isVitest(): boolean {
    return process.env.VITEST === 'true';
  }

  public static get isElectronMochaMain(): boolean {
    return !!process.env.PLM_EM_MAIN;
  }

  public static get isElectronMochaRenderer(): boolean {
    return !!process.env.PLM_EM_RENDERER;
  }

  public static get isUnitTest(): boolean {
    return this.isVitest || this.isElectronMochaMain || this.isElectronMochaRenderer;
  }
}
