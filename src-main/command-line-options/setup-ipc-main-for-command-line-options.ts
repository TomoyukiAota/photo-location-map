import { ipcMain } from 'electron';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import type { OpenTarget } from '../../src-shared/bridge/plm-bridge';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { Logger } from '../../src-shared/log/logger';
import { assertFromMainWindow } from '../ipc/ipc-sender';
import { rememberUserChosenFolder } from '../ipc/user-chosen-folders';
import { commandLineOptionsValue } from './command-line-options-value';

/** What `--open` asks the app to open: the file or folder at `specifiedPath`, as it is now. */
export async function openTargetOf(specifiedPath: string | undefined): Promise<OpenTarget> {
  if (!specifiedPath)
    return { kind: 'none' };
  let stats: fsExtra.Stats;
  try {
    stats = await fsExtra.stat(specifiedPath);
  } catch (error) {
    return { kind: 'failed', path: specifiedPath, message: error instanceof Error ? error.message : String(error) };
  }
  if (stats.isFile())
    return { kind: 'file', path: specifiedPath, parentFolderPath: path.dirname(specifiedPath) };
  if (stats.isDirectory())
    return { kind: 'directory', path: specifiedPath };
  return { kind: 'unexpected', path: specifiedPath };
}

export function setupIpcMainForCommandLineOptions() {
  ipcMain.handle(IpcConstants.CommandLineOptions.OpenTarget, async event => {
    Logger.debug(`[IPC Main Received] ${IpcConstants.CommandLineOptions.OpenTarget}`);
    assertFromMainWindow(event, 'Reading --open');
    const target = await openTargetOf(commandLineOptionsValue.get()?.open);
    // The user chose this folder, or the folder of this file, by opening the app with it.
    if (target.kind === 'directory') rememberUserChosenFolder(target.path);
    if (target.kind === 'file') rememberUserChosenFolder(target.parentFolderPath);
    return target;
  });
}
