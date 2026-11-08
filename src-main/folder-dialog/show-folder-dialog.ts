import { BrowserWindow, dialog, OpenDialogOptions, WebContents } from 'electron';

export interface FolderDialogRequest {
  /** The folder the picker starts in, which the renderer checked is still a folder (open-folder-dialog-history.ts). */
  defaultPath?: string;
}

/** What the renderer gets back: the same two fields that dialog.showOpenDialog gives. */
export interface FolderDialogResult {
  canceled: boolean;
  filePaths: string[];
}

/**
 * Shows the folder picker, modal to the window of `sender`, as it was when the renderer showed it itself.
 * `electron` is replaced in tests; dialog.showOpenDialog is looked up at each call, so that a test can stub it.
 */
export async function showFolderDialog(sender: WebContents, request: unknown,
                                       electron: { BrowserWindow: Pick<typeof BrowserWindow, 'fromWebContents'>, dialog: Pick<typeof dialog, 'showOpenDialog'> }
                                         = { BrowserWindow, dialog }): Promise<FolderDialogResult> {
  const window = electron.BrowserWindow.fromWebContents(sender);
  if (!window)
    throw new Error('The folder picker can only be shown for a window.');
  const defaultPath = (request as FolderDialogRequest | undefined)?.defaultPath;
  const options: OpenDialogOptions = {
    properties: ['openDirectory'],
    defaultPath: typeof defaultPath === 'string' ? defaultPath : undefined,
  };
  const { canceled, filePaths } = await electron.dialog.showOpenDialog(window, options);
  return { canceled, filePaths };
}
