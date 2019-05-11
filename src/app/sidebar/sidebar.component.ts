import { ChangeDetectorRef, Component } from '@angular/core';
import * as createDirectoryTree from 'directory-tree';
import { Logger } from '../../../src-shared/log/logger';
import { ElectronService } from '../shared/electron.service';
import { PhotoDataService } from '../shared/photo-data.service';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  public readonly messageWhenFolderIsNotSelected = 'The selected folder will be displayed here.';
  public selectedFolderPath = '';

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private electronService: ElectronService,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService) {
  }

  public showSelectFolderDialog() {
    this.electronService.remote.dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
      },
      this.handleFolderSelected
    );
  }

  private readonly handleFolderSelected = (folderPaths: string[]) => {
    if (!folderPaths)
      return;

    const selectedFolderPath = folderPaths[0];
    Logger.info(`Selected Folder: ${selectedFolderPath}`);
    const directoryTreeObject = createDirectoryTree(selectedFolderPath);
    Logger.info('Directory tree object: ', directoryTreeObject);
    this.photoDataService.update(directoryTreeObject)
      .then(() => {
        this.directoryTreeViewDataService.update(directoryTreeObject);
        this.selectedFolderPath = selectedFolderPath;
        this.changeDetectorRef.detectChanges();
      })
      .catch(reason =>
        Logger.error(`Something went wrong after selecting the folder ${selectedFolderPath} : `, reason)
      );
  };
}
