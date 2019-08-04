import { ChangeDetectorRef, Component } from '@angular/core';
import * as createDirectoryTree from 'directory-tree';
import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { ElectronService } from '../shared/service/electron.service';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { FolderSelectionRecorder } from './folder-selection-recorder';

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
    FolderSelectionRecorder.start(selectedFolderPath);
    const directoryTreeObject = createDirectoryTree(selectedFolderPath);
    DirTreeObjectRecorder.record(directoryTreeObject);
    this.photoDataService.update(directoryTreeObject)
      .then(() => {
        this.directoryTreeViewDataService.update(directoryTreeObject);
        this.selectedFolderPath = selectedFolderPath;
        this.changeDetectorRef.detectChanges();
        FolderSelectionRecorder.complete();
      })
      .catch(reason =>
        FolderSelectionRecorder.fail(reason)
      );
  };
}
