import { ProxyRequire } from '../require/proxy-require';

const os = ProxyRequire.os;

export class Command {
  public static toRunAssociatedApp(path: string): string {
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
