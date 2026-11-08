import { Component, inject } from '@angular/core';
import { ipcRenderer } from 'electron';
import * as fsExtra from 'fs-extra';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { Logger } from '../../../../src-shared/log/logger';
import { perfMark } from '../../../../src-shared/perf/perf-mark';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { OpenFolderService } from '../../shared/service/open-folder.service';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';
import { OpenFolderDialogHistory } from './open-folder-dialog-history';
import { MatButton } from '@angular/material/button';
import { SidebarUpperPaneMoreOptionsComponent } from './more-options/sidebar-upper-pane-more-options.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar-upper-pane',
  templateUrl: './sidebar-upper-pane.component.html',
  styleUrl: './sidebar-upper-pane.component.scss',
  imports: [MatButton, SidebarUpperPaneMoreOptionsComponent, TranslatePipe]
})
export class SidebarUpperPaneComponent {
  private openFolderService = inject(OpenFolderService);
  public thumbnailGenerationService = inject(ThumbnailGenerationService);

  private readonly folderDialogHistory = new OpenFolderDialogHistory({
    read: () => UserDataStorage.readOrDefault(UserDataStoragePath.FolderDialog.LastConfirmedDirectory, null),
    write: directoryPath => UserDataStorage.write(UserDataStoragePath.FolderDialog.LastConfirmedDirectory, directoryPath),
    isDirectory: async directoryPath => (await fsExtra.stat(directoryPath)).isDirectory(),
    reportFailure: error => Logger.warn('Could not restore or persist folder dialog history.', error),
  });

  public async showOpenFolderDialog() {
    perfMark('open-folder:dialog-requested');
    // The main process shows the picker for this window (src-main/folder-dialog/).
    const result: { canceled: boolean, filePaths: string[] } = await ipcRenderer.invoke(IpcConstants.FolderDialog.Show, {
      defaultPath: await this.folderDialogHistory.getDefaultPath(),
    });

    perfMark('open-folder:dialog-returned');
    const selectedFolderPath = this.folderDialogHistory.rememberSelection(result);
    if (!selectedFolderPath)
      return;

    await this.openFolderService.open(selectedFolderPath);
  }
}
