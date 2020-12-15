import * as os from 'os';

export class CommandString {
  public static toOpenWithAssociatedApp(path: string): string {
    switch (os.platform()) {
      case 'win32':
        return `explorer "${path}"`;
      case 'darwin':
        return `open "${path}"`;
      case 'linux':
        return `xdg-open "${path}"`;
      default:
        return null;
    }
  }

  public static toOpenContainingFolder(path: string): string {
    switch (os.platform()) {
      case 'win32':
        return `explorer /select,"${path}"`;
      case 'darwin':
        return `open -R "${path}"`;
      case 'linux':
        return `nautilus "${path}"`;
      default:
        return null;
    }
  }
}
