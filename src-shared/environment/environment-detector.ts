export class EnvironmentDetector {
  public static get isKarma(): boolean {
    return typeof __karma__ !== 'undefined';
  }

  public static get isElectronMochaMain(): boolean {
    return typeof __electronMochaMain__ !== 'undefined';
  }

  public static get isElectronMochaRenderer(): boolean {
    return typeof __electronMochaRenderer__ !== 'undefined';
  }

  public static get isUnitTest(): boolean {
    return this.isKarma || this.isElectronMochaMain || this.isElectronMochaRenderer;
  }
}
