import { ChangeDetectorRef, Component } from '@angular/core';
import * as createDirectoryTree from 'directory-tree';

import { Logger } from '../../../../src-shared/log/logger';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  readonly messageWhenFolderIsNotSelected = 'The selected folder will be displayed here.';
  selectedFolderPath = '';

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private electronService: ElectronService) {
  }

  showSelectFolderDialog() {
    this.electronService.remote.dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
      },
      (folderPaths) => {
        if (!folderPaths)
          return;

        const selectedFolderPath = folderPaths[0];
        Logger.info(`Following directory is selected: ${selectedFolderPath}`);
        const directoryTreeObject = createDirectoryTree(selectedFolderPath);
        Logger.info('Directory tree object: ', directoryTreeObject);
        this.selectedFolderPath = selectedFolderPath;
        this.changeDetectorRef.detectChanges();
      }
    );
  }
}
