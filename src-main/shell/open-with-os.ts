import * as childProcess from 'child_process';
import * as os from 'os';
import * as pathModule from 'path';
import { Logger } from '../../src-shared/log/logger.js';
import { isFilePathTooLongOnWindows, maxFilePathLengthOnWindows } from '../../src-shared/max-file-path-length-on-windows/max-file-path-length-on-windows.js';
import { logged, shown } from '../../src-shared/log/logged-line.js';

/** Whether `url` is a web page, the only kind that the main window's page may open in the OS browser. */
export function isWebPageUrl(url: unknown): url is string {
  if (typeof url !== 'string')
    return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** A program to run, with its arguments: on Windows, the arguments as Explorer reads its command line. */
export interface OsCommand {
  file: string;
  args: string[];
  windowsVerbatimArguments: boolean;
}

// TL;DR: These commands run without a shell, so that no character in a path can run anything else.
// Details: Until the main window was isolated, the renderer ran `open "<path>"` and the like in a shell, where a file
// name with $(...), backquotes or a double quote would have run as a command, and a Windows one with %NAME% would
// have changed. Explorer parses its own command line, which windowsVerbatimArguments passes as written here, the
// same as the shell passed it; a path on Windows cannot contain a double quote.

export function commandToOpenWithAssociatedApp(path: string, platform: string = os.platform()): OsCommand | null {
  switch (platform) {
    case 'win32':
      return { file: 'explorer', args: [`"${path}"`], windowsVerbatimArguments: true };
    case 'darwin':
      return { file: 'open', args: [path], windowsVerbatimArguments: false };
    case 'linux':
      return { file: 'xdg-open', args: [path], windowsVerbatimArguments: false };
    default:
      return null;
  }
}

/** The command that shows `path` in its folder with `platform`'s file manager, or null on a platform without one. */
export function commandToOpenContainingFolder(path: string, platform: string = os.platform()): OsCommand | null {
  switch (platform) {
    case 'win32':
      return { file: 'explorer', args: [`/select,"${path}"`], windowsVerbatimArguments: true };
    case 'darwin':
      return { file: 'open', args: ['-R', path], windowsVerbatimArguments: false };
    case 'linux':
      return { file: 'nautilus', args: [path], windowsVerbatimArguments: false };
    default:
      return null;
  }
}

function run(command: OsCommand): string {
  const child = childProcess.spawn(command.file, command.args, {
    stdio: 'ignore', windowsVerbatimArguments: command.windowsVerbatimArguments,
  });
  // Without a shell, a program that is not there, such as nautilus, fails here instead of in the shell.
  child.on('error', error => Logger.error(logged`Failed to run ${shown(command.file)}.`, error));
  return [command.file, ...command.args].join(' ');
}

/** Opens `path` with the app that the OS associates with it, and warns when Windows may not open so long a path. */
export function openWithAssociatedApp(path: string): void {
  const fileOrFolderName = pathModule.basename(path);
  const command = commandToOpenWithAssociatedApp(path);
  if (command) {
    Logger.info(`Issued a command: ${run(command)}`);
    Logger.info(`Opened with associated app: ${path}`);

    if (isFilePathTooLongOnWindows(path)) {
      Logger.warn(logged`Opening ${fileOrFolderName} with its associated app might not work because the length of the file path exceeds the maximum on Windows.\nMaximum: ${maxFilePathLengthOnWindows} characters\nFile path: ${path.length} characters`);
    }
  } else {
    Logger.warn(logged`Opening ${fileOrFolderName} with its associated app is not supported on this platform: ${shown(os.platform())}, file path: ${path}`);
  }
}

/** Shows `path` in its folder with the OS's file manager, and warns when Windows may not open so long a path. */
export function openContainingFolder(path: string): void {
  const fileOrFolderName = pathModule.basename(path);
  const command = commandToOpenContainingFolder(path);
  if (command) {
    Logger.info(`Issued a command: ${run(command)}`);
    Logger.info(`Opened the containing folder of "${path}"`);

    if (isFilePathTooLongOnWindows(path)) {
      Logger.warn(logged`Opening the containing folder of ${fileOrFolderName} might not work because the length of the file path exceeds the maximum on Windows.\nMaximum: ${maxFilePathLengthOnWindows} characters\nFile path: ${path.length} characters`);
    }
  } else {
    Logger.warn(logged`Opening the containing folder of ${fileOrFolderName} is not supported on this platform: ${shown(os.platform())}, file path: ${path}`);
  }
}
