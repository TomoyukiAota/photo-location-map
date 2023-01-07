import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import * as remote from '@electron/remote';

import { DirTreeObjectRecorder } from '../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { sleep } from '../../../src-shared/sleep/sleep';

import { OpenFolderService } from '../shared/service/open-folder.service';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { PhotoSelectionHistoryService } from '../shared/service/photo-selection-history.service';
import { LoadingFolderProgress } from '../shared/loading-folder-progress';
import { OpenedDirectory } from '../shared/opened-directory';
import { ThumbnailObjectUrlStorage } from '../shared/thumbnail-object-url-storage';

import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { LoadedFilesStatusBarService } from '../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { LoadingFolderDialogComponent } from '../loading-folder/dialog/loading-folder-dialog.component';
import { NoPhotosWithLocationDataDialogComponent } from '../no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component';
import { PhotoInfoViewerContent } from '../photo-info-viewer/photo-info-viewer-content';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { OpenFolderRecorder } from './open-folder-recorder';

const path = ProxyRequire.path;

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  public readonly messageWhenFolderIsNotOpened = 'Please open a folder to see where photos were taken.';
  public parentFolderPath = new Subject<string>();

  constructor(private dialog: MatDialog,
              private openFolderService: OpenFolderService,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService,
              private loadedFilesStatusBarService: LoadedFilesStatusBarService,
              public thumbnailGenerationService: ThumbnailGenerationService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService) {
  }

  public async showOpenFolderDialog() {
    const result = await remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        properties: ['openDirectory'],
      }
    );

    const isCanceled = result.filePaths.length === 0;
    if (isCanceled)
      return;

    const openedFolderPath = result.filePaths[0];
    await this.handleOpenedFolder(openedFolderPath);
  }

  private async handleOpenedFolder(openedFolderPath: string) {
    let loadingFolderDialogRef: MatDialogRef<LoadingFolderDialogComponent> = null;

    try {
      OpenFolderRecorder.start(openedFolderPath);
      this.photoSelectionHistoryService.reset();
      PhotoInfoViewerContent.clearCache();
      ThumbnailObjectUrlStorage.revokeObjectUrls();
      this.openFolderService.folderOpened.next();

      loadingFolderDialogRef = this.showLoadingFolderDialog();

      const directoryTreeObject = await OpenedDirectory.createDirectoryTree(openedFolderPath);
      await this.photoDataService.update(directoryTreeObject); // Photo data is fetched from files. The loading folder dialog displays file loading status.
      await sleep(100); // To update the loading folder dialog before starting intensive work (PhotoInfoViewerContent.generateCache) which freezes GUI.

      this.parentFolderPath.next(path.dirname(openedFolderPath) + path.sep);
      this.showPhotoWithLocationNotFoundDialogIfApplicable();
      PhotoInfoViewerContent.generateCache(this.photoDataService.getAllPhotos());
      this.directoryTreeViewDataService.replace(directoryTreeObject);
      this.loadedFilesStatusBarService.updateStatus();
      this.thumbnailGenerationService.startThumbnailGeneration(directoryTreeObject);
      DirTreeObjectRecorder.record(directoryTreeObject);
      OpenFolderRecorder.complete();
    } catch (reason) {
      OpenFolderRecorder.fail(reason);
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
