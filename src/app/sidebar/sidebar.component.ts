import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import * as remote from '@electron/remote';

import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { sleep } from '../../../src-shared/sleep/sleep';

import { FolderSelectionService } from '../shared/service/folder-selection.service';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { LoadingFolderProgress } from '../shared/loading-folder-progress';
import { SelectedDirectory } from '../shared/selected-directory';
import { ThumbnailObjectUrlStorage } from '../shared/thumbnail-object-url-storage';

import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { LoadedFilesStatusBarService } from '../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { LoadingFolderDialogComponent } from '../loading-folder/dialog/loading-folder-dialog.component';
import { NoPhotosWithLocationDataDialogComponent } from '../no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component';
import { PhotoInfoViewerContent } from '../photo-info-viewer/photo-info-viewer-content';
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
  public parentFolderPath = new Subject<string>();

  constructor(private dialog: MatDialog,
              private folderSelectionService: FolderSelectionService,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService,
              private loadedFilesStatusBarService: LoadedFilesStatusBarService,
              public thumbnailGenerationService: ThumbnailGenerationService) {
  }

  public async showSelectFolderDialog() {
    const result = await remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        properties: ['openDirectory'],
      }
    );

    const isCanceled = result.filePaths.length === 0;
    if (isCanceled)
      return;

    const selectedFolderPath = result.filePaths[0];
    await this.handleSelectedFolder(selectedFolderPath);
  }

  private async handleSelectedFolder(selectedFolderPath: string) {
    let loadingFolderDialogRef: MatDialogRef<LoadingFolderDialogComponent> = null;

    try {
      FolderSelectionRecorder.start(selectedFolderPath);
      PhotoInfoViewerContent.clearCache();
      ThumbnailObjectUrlStorage.revokeObjectUrls();
      this.folderSelectionService.folderSelected.next();

      loadingFolderDialogRef = this.showLoadingFolderDialog();

      const directoryTreeObject = await SelectedDirectory.createDirectoryTree(selectedFolderPath);
      await this.photoDataService.update(directoryTreeObject); // Photo data is fetched from files. The loading folder dialog displays file loading status.
      await sleep(100); // To update the loading folder dialog before starting intensive work (PhotoInfoViewerContent.generateCache) which freezes GUI.

      this.parentFolderPath.next(path.dirname(selectedFolderPath) + path.sep);
      this.showPhotoWithLocationNotFoundDialogIfApplicable();
      PhotoInfoViewerContent.generateCache(this.photoDataService.getAllPhotos());
      this.directoryTreeViewDataService.replace(directoryTreeObject);
      this.loadedFilesStatusBarService.updateStatus();
      this.thumbnailGenerationService.startThumbnailGeneration(directoryTreeObject);
      DirTreeObjectRecorder.record(directoryTreeObject);
      FolderSelectionRecorder.complete();
    } catch (reason) {
      FolderSelectionRecorder.fail(reason);
    } finally {
      loadingFolderDialogRef?.close();
      LoadingFolderProgress.reset();
    }
  }

  private showLoadingFolderDialog() {
    return this.dialog.open(LoadingFolderDialogComponent, {
      width: '440px',
      height: '120px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
  }

  private showPhotoWithLocationNotFoundDialogIfApplicable(): void {
    const photoWithLocation = this.photoDataService.getPhotosWithGpsInfo();
    if (photoWithLocation.length >= 1)
      return;

    this.dialog.open(NoPhotosWithLocationDataDialogComponent, {
      width: '500px',
      height: '125px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
  }
}
