import { ipcMain } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants';
import { showFolderDialog } from './show-folder-dialog';

// The folder picker for Open Folder (src/app/sidebar/upper-pane/sidebar-upper-pane.component.ts).
ipcMain.handle(IpcConstants.FolderDialog.Show, (event, request) => showFolderDialog(event.sender, request));
