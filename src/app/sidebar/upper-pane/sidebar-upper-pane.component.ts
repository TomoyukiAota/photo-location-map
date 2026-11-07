import { Component } from '@angular/core';
import * as remote from '@electron/remote';
import { Logger } from '../../../../src-shared/log/logger';
import { RequireFromMainProcess } from '../../../../src-shared/require/require-from-main-process';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { OpenFolderService } from '../../shared/service/open-folder.service';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';
import { OpenFolderDialogHistory } from './open-folder-dialog-history';

@Component({
  selector: 'app-sidebar-upper-pane',
  templateUrl: './sidebar-upper-pane.component.html',
  styleUrl: './sidebar-upper-pane.component.scss',
  standalone: false
})
export class SidebarUpperPaneComponent {
  private readonly folderDialogHistory = new OpenFolderDialogHistory({
    read: () => UserDataStorage.readOrDefault(UserDataStoragePath.FolderDialog.LastConfirmedDirectory, null),
    write: directoryPath => UserDataStorage.write(UserDataStoragePath.FolderDialog.LastConfirmedDirectory, directoryPath),
    isDirectory: async directoryPath => (await RequireFromMainProcess.fsExtra.stat(directoryPath)).isDirectory(),
    reportFailure: error => Logger.warn('Could not restore or persist folder dialog history.', error),
  });

  constructor(private openFolderService: OpenFolderService,
              public thumbnailGenerationService: ThumbnailGenerationService,
  ) {
  }

  public async showOpenFolderDialog() {
    const result = await remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        properties: ['openDirectory'],
        defaultPath: await this.folderDialogHistory.getDefaultPath(),
      }
    );

    const selectedFolderPath = this.folderDialogHistory.rememberSelection(result);
    if (!selectedFolderPath)
      return;

    await this.openFolderService.open(selectedFolderPath);
  }
}
