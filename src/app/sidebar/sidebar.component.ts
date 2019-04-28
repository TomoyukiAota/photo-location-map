import { ChangeDetectorRef, Component } from '@angular/core';

import { Logger } from '../../../src-shared/log/logger';
import { ElectronService } from '../shared/electron.service';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  readonly messageWhenFolderIsNotSelected = 'The selected folder will be displayed here.';
  selectedFolderPath = '';

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private electronService: ElectronService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService) {
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
        this.directoryTreeViewDataService.update(selectedFolderPath);
        this.selectedFolderPath = selectedFolderPath;
        this.changeDetectorRef.detectChanges();
      }
    );
  }
}
