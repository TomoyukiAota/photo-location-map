export class ProcessAccessor {
  /** Node.js's process, or undefined where there is none, as in a page without Node.js. */
  public static getProcess(): NodeJS.Process | undefined {
    return typeof process === 'undefined' ? undefined : process;
  }
}
