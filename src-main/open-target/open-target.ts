import * as fs from 'fs';
import * as path from 'path';
import type { OpenTarget } from '../../src-shared/bridge/plm-bridge.js';
import { rememberUserChosenFolder } from '../ipc/user-chosen-folders.js';

// What a path given to the app opens: that of --open (src-main/command-line-options/), or that of a folder or a file
// that the user dropped on the main window (src-main/dropped-item/). The renderer opens it in the same way for both
// (src/app/shared/service/open-target.service.ts).

/** What the file or folder at `specifiedPath` opens, as it is now. */
export async function openTargetOf(specifiedPath: string | undefined): Promise<OpenTarget> {
  if (!specifiedPath)
    return { kind: 'none' };
  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(specifiedPath);
  } catch (error) {
    return { kind: 'failed', path: specifiedPath, message: error instanceof Error ? error.message : String(error) };
  }
  if (stats.isFile())
    return { kind: 'file', path: specifiedPath, parentFolderPath: path.dirname(specifiedPath) };
  if (stats.isDirectory())
    return { kind: 'directory', path: specifiedPath };
  return { kind: 'unexpected', path: specifiedPath };
}

/** Remembers the folder that `target` opens as one that the user chose: a folder itself, or the folder of a file. */
export function chooseFolderOf(target: OpenTarget): void {
  if (target.kind === 'directory') rememberUserChosenFolder(target.path);
  if (target.kind === 'file') rememberUserChosenFolder(target.parentFolderPath);
}
