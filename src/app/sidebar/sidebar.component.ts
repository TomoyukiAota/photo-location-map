import { ChangeDetectorRef, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as remote from '@electron/remote';
import * as createDirectoryTree from 'directory-tree';

import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { removeInvalidThumbnailCache } from '../../../src-shared/thumbnail-cache/remove-invalid-thumbnail-cache';

import { FolderSelectionService } from '../shared/service/folder-selection.service';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { LoadingFolderProgress } from '../shared/loading-folder-progress';
import { ThumbnailObjectUrlStorage } from '../shared/thumbnail-object-url-storage';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { LoadingFolderDialogComponent } from '../loading-folder/dialog/loading-folder-dialog.component';
import { NoPhotosWithGpsLocationDialogComponent } from '../no-photos-with-gps-location-dialog/no-photos-with-gps-location-dialog.component';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { FolderSelectionRecorder } from './folder-selection-recorder';

const path = ProxyRequire.path;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  public readonly messageWhenFolderIsNotSelected = 'Please select a folder to see where photos were taken.';
  public parentFolderPath = '';

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private dialog: MatDialog,
              private folderSelectionService: FolderSelectionService,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService,
              public thumbnailGenerationService: ThumbnailGenerationService) {
  }

  public showSelectFolderDialog() {
    remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
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
    ThumbnailObjectUrlStorage.revokeObjectUrls();
    this.folderSelectionService.folderSelected.next();
    const loadingFolderDialogRef = this.dialog.open(LoadingFolderDialogComponent, {
      width: '350px',
      height: '120px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
    FolderSelectionRecorder.start(selectedFolderPath);
    const directoryTreeObject = createDirectoryTree(selectedFolderPath);
    DirTreeObjectRecorder.record(directoryTreeObject);
    this.photoDataService.update(directoryTreeObject)
      .then(() => {
        this.showPhotoWithLocationNotFoundDialogIfApplicable();
        this.directoryTreeViewDataService.replace(directoryTreeObject);
        this.parentFolderPath = path.dirname(selectedFolderPath) + path.sep;
        this.changeDetectorRef.detectChanges();
        FolderSelectionRecorder.complete();
      })
      .catch(reason =>
        FolderSelectionRecorder.fail(reason)
      )
      .finally(() => {
        loadingFolderDialogRef.close();
        LoadingFolderProgress.reset();
        removeInvalidThumbnailCache();
        this.thumbnailGenerationService.startThumbnailGeneration(directoryTreeObject);
      });
  };

  private showPhotoWithLocationNotFoundDialogIfApplicable(): void {
    const photoWithLocation = this.photoDataService.getPhotosWithGpsInfo();
    if (photoWithLocation.length >= 1)
      return;

    this.dialog.open(NoPhotosWithGpsLocationDialogComponent, {
      width: '500px',
      height: '125px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
  }
}
