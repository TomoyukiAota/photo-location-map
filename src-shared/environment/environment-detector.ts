export class EnvironmentDetector {
  public static isKarma(): boolean {
    return typeof __karma__ !== 'undefined';
  }

  public static isElectronMochaMain(): boolean {
    return typeof __electronMochaMain__ !== 'undefined';
  }

  public static isUnitTest(): boolean {
    return this.isKarma() || this.isElectronMochaMain();
  }
}
