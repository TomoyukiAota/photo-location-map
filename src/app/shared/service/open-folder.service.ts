import { Injectable, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { DirTreeObjectRecorder } from '../../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { sleep } from '../../../../src-shared/sleep/sleep';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
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
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Injectable({
  providedIn: 'root'
})
export class OpenFolderService {
  private readonly isFolderOpenedState = signal(false);
  /** Whether a folder has been opened since the application started. */
  public readonly isFolderOpened = this.isFolderOpenedState.asReadonly();
  /**
   * Raised each time a folder starts opening, the second time included. isFolderOpened is already true by then, and a
   * signal set to the value it has notifies no one, so what has to happen on every open listens to this.
   */
  public readonly folderOpened = new Subject<void>();

  constructor(private dialog: MatDialog,
              private photoDataService: PhotoDataService,
              private directoryTreeViewDataService: DirectoryTreeViewDataService,
              public thumbnailGenerationService: ThumbnailGenerationService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService,
  ) {
  }

  public async open(folderPath: string) {
    let loadingFolderDialogRef: MatDialogRef<LoadingFolderDialogComponent> = null;

    try {
      OpenFolderRecorder.start(folderPath);
      this.photoSelectionHistoryService.reset();
      PhotoInfoViewerContent.clearCache();
      ThumbnailObjectUrlStorage.revokeObjectUrls();
      this.isFolderOpenedState.set(true);
      this.folderOpened.next();

      loadingFolderDialogRef = this.showLoadingFolderDialog();

      const directoryTreeObject = await OpenedDirectory.createDirectoryTree(folderPath);
      await this.photoDataService.update(directoryTreeObject); // Photo data is fetched from files. The loading folder dialog displays file loading status.
      await sleep(100); // To update the loading folder dialog before the work below, which freezes the GUI for a large folder.

      this.showPhotoWithLocationNotFoundDialogIfApplicable();
      this.directoryTreeViewDataService.replace(directoryTreeObject);
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
