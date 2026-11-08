import { signal, inject, Service } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DirTreeObjectRecorder } from '../../../../src-shared/dir-tree-object-recorder/dir-tree-object-recorder';
import { perfMark } from '../../../../src-shared/perf/perf-mark';
import { sleep } from '../../../../src-shared/sleep/sleep';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
import { LoadingFolderDialogComponent } from '../../loading-folder/dialog/loading-folder-dialog.component';
import {
  NoPhotosWithLocationDataDialogComponent
} from '../../no-photos-with-location-data-dialog/no-photos-with-location-data-dialog.component';
import { PhotoInfoViewerContent } from '../../photo-info-viewer/photo-info-viewer-content';
import { OpenFolderRecorder } from '../../sidebar/upper-pane/open-folder-recorder';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../../thumbnail-generation/status-bar/service/thumbnail-generation-status-bar.service';
import { LoadingFolderProgress } from '../loading-folder-progress';
import { OpenedDirectory } from '../opened-directory';
import { ThumbnailObjectUrlStorage } from '../thumbnail-object-url-storage';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Service()
export class OpenFolderService {
  private dialog = inject(MatDialog);
  private photoDataService = inject(PhotoDataService);
  private directoryTreeViewDataService = inject(DirectoryTreeViewDataService);
  public thumbnailGenerationService = inject(ThumbnailGenerationService);
  private thumbnailGenerationStatusBarService = inject(ThumbnailGenerationStatusBarService);
  private photoSelectionHistoryService = inject(PhotoSelectionHistoryService);

  private readonly isFolderOpenedState = signal(false);
  /** Whether a folder has been opened since the application started. */
  public readonly isFolderOpened = this.isFolderOpenedState.asReadonly();

  /**
   * Opens a folder: reads its photos while the loading dialog is shown, then shows its tree, which pins its photos on
   * the map and the chart, and starts making the thumbnails of its HEIF files.
   */
  public async open(folderPath: string) {
    let loadingFolderDialogRef: MatDialogRef<LoadingFolderDialogComponent> = null;

    try {
      perfMark('open-folder:start');
      OpenFolderRecorder.start(folderPath);
      this.photoSelectionHistoryService.reset();
      PhotoInfoViewerContent.clearCache();
      ThumbnailObjectUrlStorage.revokeObjectUrls();
      this.isFolderOpenedState.set(true);
      // Every open hides the thumbnail status bar of the previous folder, the second open too. This is a call rather
      // than something derived from isFolderOpened: a signal set to the value it already has notifies no one.
      this.thumbnailGenerationStatusBarService.hide();

      loadingFolderDialogRef = this.showLoadingFolderDialog();

      const directoryTreeObject = await OpenedDirectory.createDirectoryTree(folderPath);
      perfMark('open-folder:tree-created');
      await this.photoDataService.update(directoryTreeObject); // Photo data is fetched from files. The loading folder dialog displays file loading status.
      perfMark('open-folder:photo-data-loaded');
      await sleep(100); // To update the loading folder dialog before the work below, which freezes the GUI for a large folder.

      this.showPhotoWithLocationNotFoundDialogIfApplicable();
      this.directoryTreeViewDataService.replace(directoryTreeObject);
      if (this.thumbnailGenerationService.startThumbnailGeneration(directoryTreeObject))
        this.thumbnailGenerationStatusBarService.showForNewGeneration();
      DirTreeObjectRecorder.record(directoryTreeObject);
      OpenFolderRecorder.complete();
      perfMark('open-folder:complete');
    } catch (reason) {
      perfMark('open-folder:failed');
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
