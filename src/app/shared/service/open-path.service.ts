import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DirTreeObjectRecorder } from '../../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { sleep } from '../../../../src-shared/sleep/sleep';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { LoadingFolderDialogComponent } from '../../loading-folder/dialog/loading-folder-dialog.component';
import {
  NoPhotosWithLocationDataDialogComponent
} from '../../no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { OpenFolderRecorder } from '../../sidebar/upper-pane/open-folder-recorder';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';
import { LoadingFolderProgress } from '../loading-folder-progress';
import { OpenedDirectory } from '../opened-directory';
import { ThumbnailObjectUrlStorage } from '../thumbnail-object-url-storage';
import { OpenFolderService } from './open-folder.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Injectable({
  providedIn: 'root'
})
export class OpenPathService {
  constructor(private dialog: MatDialog,
              private openFolderService: OpenFolderService,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService,
              private loadedFilesStatusBarService: LoadedFilesStatusBarService,
              public thumbnailGenerationService: ThumbnailGenerationService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService,
  ) {
  }

  public async open(path: string) {
    console.log(`Open Path: ${path}`);
    await this.handleOpenedFolder(path);
  }

  private async handleOpenedFolder(openedFolderPath: string) {
    let loadingFolderDialogRef: MatDialogRef<LoadingFolderDialogComponent> = null;

    try {
      OpenFolderRecorder.start(openedFolderPath);
      this.photoSelectionHistoryService.reset();
      PhotoInfoViewerContent.clearCache();
      ThumbnailObjectUrlStorage.revokeObjectUrls();
      this.openFolderService.isFolderOpened$.next(true);

      loadingFolderDialogRef = this.showLoadingFolderDialog();

      const directoryTreeObject = await OpenedDirectory.createDirectoryTree(openedFolderPath);
      await this.photoDataService.update(directoryTreeObject); // Photo data is fetched from files. The loading folder dialog displays file loading status.
      await sleep(100); // To update the loading folder dialog before starting intensive work (PhotoInfoViewerContent.generateCache) which freezes GUI.

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
