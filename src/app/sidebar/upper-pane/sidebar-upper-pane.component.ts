import { Component, inject } from '@angular/core';
import { bridge } from '../../../../src-shared/bridge/plm-bridge';
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
    // The main process checks the folder that the picker would start in (src-main/folder-dialog/).
    isDirectory: directoryPath => bridge().folderDialog.isDirectory(directoryPath),
    reportFailure: error => Logger.warn('Could not restore or persist folder dialog history.', error),
  });

  public async showOpenFolderDialog() {
    perfMark('open-folder:dialog-requested');
    // The main process shows the picker for this window (src-main/folder-dialog/).
    const result = await bridge().folderDialog.show({
      defaultPath: await this.folderDialogHistory.getDefaultPath(),
    });

    perfMark('open-folder:dialog-returned');
    const selectedFolderPath = this.folderDialogHistory.rememberSelection(result);
    if (!selectedFolderPath)
      return;

    await this.openFolderService.open(selectedFolderPath);
  }
}
