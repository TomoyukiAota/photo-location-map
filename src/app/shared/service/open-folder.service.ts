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
import { GeneratedThumbnailService } from '../../photo-info-viewer/generated-thumbnail.service';
import { ThumbnailRotationService } from '../../photo-info-viewer/thumbnail-rotation.service';
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
  private generatedThumbnailService = inject(GeneratedThumbnailService);
  private thumbnailRotationService = inject(ThumbnailRotationService);

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
      ThumbnailObjectUrlStorage.revokeObjectUrls();
      this.isFolderOpenedState.set(true);
      // Every open hides the thumbnail status bar of the previous folder, the second open too. This is a call rather
      // than something derived from isFolderOpened: a signal set to the value it already has notifies no one.
      this.thumbnailGenerationStatusBarService.hide();

      loadingFolderDialogRef = this.showLoadingFolderDialog();

      const directoryTreeObject = await OpenedDirectory.createDirectoryTree(folderPath);
      perfMark('open-folder:tree-created');
      // TL;DR: The main process checks the thumbnail cache while the photos' data are read, so that the generation
      // starts right after them, as when the renderer checked the cache itself.
      // Details: Asked after the tree was shown, as it was at first, the answer came after the page had rendered the
      // tree, which then held up the folder's completion and the loading dialog's closing: 34 ms for the large folder
      // of the measurements (series rer-2-C1b).
      const thumbnailCache = this.thumbnailGenerationService.checkThumbnailCache(directoryTreeObject);
      thumbnailCache.catch(() => {});  // Awaited below; a failure then fails the open, as other failures do.
      await this.photoDataService.update(directoryTreeObject); // Photo data is fetched from files. The loading folder dialog displays file loading status.
      perfMark('open-folder:photo-data-loaded');
      // TL;DR: What was kept of the previous folder's photos is dropped here: how far each thumbnail is turned, and
      // which thumbnails were made.
      // Details: Not before the folder's photos are read: the previous folder is shown until then, behind the
      // loading dialog, and its thumbnails would turn back and give way to the image that says they are being made.
      this.thumbnailRotationService.reset();
      this.generatedThumbnailService.reset();
      await sleep(100); // To update the loading folder dialog before the work below, which freezes the GUI for a large folder.

      this.showPhotoWithLocationNotFoundDialogIfApplicable();
      this.directoryTreeViewDataService.replace(directoryTreeObject);
      if (this.thumbnailGenerationService.startThumbnailGeneration(await thumbnailCache))
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
      // At least its height in English; taller for a message that takes two lines in another language.
      minHeight: '125px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
  }
}
