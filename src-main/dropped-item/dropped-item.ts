import * as path from 'path';
import type { OpenTarget } from '../../src-shared/bridge/plm-bridge.js';
import { chooseFolderOf, openTargetOf } from '../open-target/open-target.js';

// A folder or a file that the user dropped on the main window (src/app/drop-to-open/). The preload reads its path
// from the File of the drop (electron-util/preload/main-window.cjs), so a path here is one that the user dropped. It
// opens as the same path given to --open does, once the user has confirmed: its folder, or the folder that it is in,
// is then one that the user chose, as with the folder picker (src-main/ipc/user-chosen-folders.ts).

/** What the dropped item at `droppedPath` opens; nothing for what is not an absolute path, which no drop gives. */
export async function droppedItemTargetOf(droppedPath: unknown): Promise<OpenTarget> {
  if (typeof droppedPath !== 'string' || !path.isAbsolute(droppedPath))
    return { kind: 'none' };
  return openTargetOf(droppedPath);
}

/** Chooses the dropped item at `droppedPath`, which the user confirmed, and tells what it opens, as it is now. */
export async function chooseDroppedItem(droppedPath: unknown): Promise<OpenTarget> {
  const target = await droppedItemTargetOf(droppedPath);
  chooseFolderOf(target);
  return target;
}
