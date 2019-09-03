import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as createDirectoryTree from 'directory-tree';
import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { ConditionalRequire } from '../../../src-shared/require/conditional-require';
import { ElectronService } from '../shared/service/electron.service';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { FolderSelectionRecorder } from './folder-selection-recorder';
import { FolderSelectionProgressComponent } from '../folder-selection-progress/dialog/folder-selection-progress.component';

const path = ConditionalRequire.path;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  public readonly messageWhenFolderIsNotSelected = 'The selected folder will be displayed here.';
  public parentFolderPath = '';

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private dialog: MatDialog,
              private electronService: ElectronService,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService) {
  }

  public showSelectFolderDialog() {
    this.electronService.remote.dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
      }
    ).then(result => {
      const isCanceled = result.filePaths.length === 0;
      if (isCanceled)
        return;

      const selectedFolderPath = result.filePaths[0];
      this.handleSelectedFolder(selectedFolderPath);
    });
  }

  private readonly handleSelectedFolder = (selectedFolderPath: string) => {
    const dialogRef = this.dialog.open(FolderSelectionProgressComponent, {
      width: '300px',
      height: '150px',
      panelClass: 'custom-dialog-container',
      disableClose: true
    });
    FolderSelectionRecorder.start(selectedFolderPath);
    const directoryTreeObject = createDirectoryTree(selectedFolderPath);
    DirTreeObjectRecorder.record(directoryTreeObject);
    this.photoDataService.update(directoryTreeObject)
      .then(() => {
        this.directoryTreeViewDataService.update(directoryTreeObject);
        this.parentFolderPath = path.dirname(selectedFolderPath) + path.sep;
        this.changeDetectorRef.detectChanges();
        FolderSelectionRecorder.complete();
      })
      .catch(reason =>
        FolderSelectionRecorder.fail(reason)
      )
      .finally(() => {
        dialogRef.close();
      });
  };
}
