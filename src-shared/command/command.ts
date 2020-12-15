import * as child_process from 'child_process';
import * as os from 'os';
import * as pathModule from 'path';
import { Logger } from '../log/logger';
import { isFilePathTooLongOnWindows, maxFilePathLengthOnWindows } from '../max-file-path-length-on-windows/max-file-path-length-on-windows';

export function openWithAssociatedApp(path: string): void {
  const fileOrFolderName = pathModule.basename(path);
  const command = Command.toRunAssociatedApp(path);
  if (command) {
    child_process.spawn(command, [], { shell: true });
    Logger.info(`Issued a command: ${command}`);
    Logger.info(`Opened with associated app: ${path}`);

    if (isFilePathTooLongOnWindows(path)) {
      Logger.warn(`Opening ${fileOrFolderName} with its associated app might not work because the length of the file path exceeds the maximum on Windows.\n`
        + `Maximum: ${maxFilePathLengthOnWindows} characters\n`
        + `File path: ${path.length} characters`);
    }
  } else {
    Logger.warn(`Opening ${fileOrFolderName} with its associated app is not supported on this platform: ${os.platform()}, file path: ${path}`);
  }
}

export function openContainingFolder(path: string): void {
  const fileOrFolderName = pathModule.basename(path);
  const command = Command.toOpenContainingFolder(path);
  if (command) {
    child_process.spawn(command, [], { shell: true });
    Logger.info(`Issued a command: ${command}`);
    Logger.info(`Opened the containing folder of ${path}`);

    if (isFilePathTooLongOnWindows(path)) {
      Logger.warn(`Opening the containing folder of ${fileOrFolderName} might not work because the length of the file path exceeds the maximum on Windows.\n`
        + `Maximum: ${maxFilePathLengthOnWindows} characters\n`
        + `File path: ${path.length} characters`);
    }
  } else {
    Logger.warn(`Opening the containing folder of ${fileOrFolderName} is not supported on this platform: ${os.platform()}, file path: ${path}`);
  }
}

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
