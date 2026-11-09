/** The environment variables; none in a page without Node.js, such as the main window's (src-shared/process/). */
function environmentVariables(): Record<string, string | undefined> {
  return typeof process === 'undefined' ? {} : process.env;
}

export class EnvironmentDetector {
  public static get isVitest(): boolean {
    return environmentVariables().VITEST === 'true';
  }

  public static get isElectronMochaMain(): boolean {
    return !!environmentVariables().PLM_EM_MAIN;
  }

  public static get isElectronMochaRenderer(): boolean {
    return !!environmentVariables().PLM_EM_RENDERER;
  }

  public static get isUnitTest(): boolean {
    return this.isVitest || this.isElectronMochaMain || this.isElectronMochaRenderer;
  }
}
