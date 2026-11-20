import { computed, effect, inject, Service, signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import chunk from 'lodash-es/chunk.js';
import { bridge } from '../../../src-shared/bridge/plm-bridge';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { createPrependedLogger } from '../../../src-shared/log/create-prepended-logger';
import { photoFileUrl } from '../../../src-shared/main-window-schemes';
import { DirectoryTreeViewDataService } from '../directory-tree-view/directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from '../directory-tree-view/directory-tree-view-selection.service';
import { GeneratedThumbnailService } from '../photo-info-viewer/generated-thumbnail.service';
import { Photo } from '../shared/model/photo.model';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { FaceDetectorError, FaceDetectorService } from './face-detector.service';
import { FaceSearchDialogComponent, FaceSearchDialogData, FaceSearchDialogState } from './face-search-dialog/face-search-dialog.component';
import { FaceSearchImageDecoder, faceSearchImageKindOf, faceSearchImageUrlOf } from './face-search-image';
import { faceScoreThreshold } from './yunet';

const logger = createPrependedLogger('[Face Search]');

/** What the search found in a photo: a face, no face, or nothing, as when its image could not be decoded. */
type Outcome = 'face' | 'noFace' | 'failed';
/** What is kept of a photo that was looked at: whether it has a face. */
type Found = Exclude<Outcome, 'failed'>;

/** A search that runs, which the dialog's Cancel, or another folder, ends. */
interface Search {
  canceled: boolean;
}

/** The most photos that the main process reads the metadata of at a time (src-main/face-search/face-regions-ipc-setup.ts). */
const maxFaceRegionPathsPerRequest = 100;
/** How often a photo that waits for its HEIF thumbnail looks again whether it is there. */
const thumbnailWaitIntervalMs = 250;

/**
 * The Selection menu's Narrow Down to Photos with Faces: the selected photos in which a face is found stay selected,
 * and the others are deselected, as one step of the selection's history, which Undo takes back.
 * TL;DR: The photos are looked at when the item is chosen, on this computer, in a worker of the page, and what is
 * found is kept in memory while the folder is open: it is not saved, sent, or recorded for analytics.
 * Details:
 * - A photo whose metadata marks a face (src-main/face-search/face-regions.ts) has one without being looked at. The
 *   others are looked at by YuNet (face-detector.service.ts), in an image of 640 pixels at most (face-search-image.ts).
 *   A photo is decoded while the detector looks at the one before, two at a time.
 * - The photos are those selected when the item is chosen. A HEIF photo waits for the thumbnail that the app makes of
 *   it, which the dialog says; they come last. A photo whose image cannot be decoded is not taken for one with a
 *   face: the dialog says how many such photos were deselected, and the next search looks at them again, as what kept
 *   them from being looked at may have passed.
 * - When no selected photo has a face, the selection stays, so that the map is not left empty, and the dialog says
 *   so. Cancel leaves the selection as it was; what was found until then is kept.
 * - The log says how many photos were looked at and how long it took, never which photos have faces, and an error of
 *   the detector is recorded by its message alone: the faces are personal data. The selection that results is in the
 *   log, as after any change of the selection (SelectedPhotoService), which stays on this computer.
 */
@Service()
export class FaceSearchService {
  private readonly dialog = inject(MatDialog);
  private readonly faceDetector = inject(FaceDetectorService);
  private readonly generatedThumbnailService = inject(GeneratedThumbnailService);
  private readonly imageDecoder = inject(FaceSearchImageDecoder);
  private readonly selectedPhotoService = inject(SelectedPhotoService);
  private readonly selectionService = inject(DirectoryTreeViewSelectionService);

  /** What was found in each photo of the opened folder that has been looked at, by the photo's path. */
  private readonly outcomes = new Map<string, Found>();
  /** Counts the folders opened, so that what is found in a photo of the previous folder is not kept. */
  private folderNumber = 0;
  private search: Search | undefined;
  private dialogRef: MatDialogRef<FaceSearchDialogComponent> | undefined;

  private readonly dialogStateValue = signal<FaceSearchDialogState>({ kind: 'searching', done: 0, total: 0, waitingForThumbnails: false });
  /** What the dialog shows. */
  public readonly dialogState = this.dialogStateValue.asReadonly();

  /** Whether the menu's item applies: while any photo is selected. */
  private readonly isMenuEnabled = computed(() => this.selectedPhotoService.selectedPhotos().length > 0);

  constructor() {
    // From the start, which disables the item again when the page is loaded again, until a photo is selected.
    effect(() => {
      const isEnabled = this.isMenuEnabled();
      bridge().menus.updateNarrowDownToPhotosWithFaces({ isEnabled })
        .catch(error => logger.error('Failed to update the Narrow Down to Photos with Faces menu.', error));
    });
    // The photos of another folder have not been looked at, and a search of the previous folder ends.
    inject(DirectoryTreeViewDataService).dataReplaced.subscribe(() => {
      this.folderNumber++;
      this.outcomes.clear();
      this.cancel();
    });
  }

  /** The menu's item: narrows the selection down to the selected photos with faces, looking at those not yet seen. */
  public async narrowDownSelectedPhotos(): Promise<void> {
    if (this.search) {
      logger.info('A search for faces runs already; the item is ignored.');
      return;
    }
    const selected = this.selectedPhotoService.getSelectedPhotos();
    if (selected.length === 0)
      return;

    const search: Search = { canceled: false };
    this.search = search;
    try {
      let notLookedAt: ReadonlySet<string> = new Set();
      const notSeen = selected.filter(photo => !this.outcomes.has(photo.path));
      if (notSeen.length > 0) {
        this.showDialog({ kind: 'searching', done: 0, total: notSeen.length, waitingForThumbnails: false });
        const notLookedAtNow = await this.lookAt(notSeen, search);
        if (notLookedAtNow === undefined) {
          this.closeDialog();
          return;
        }
        notLookedAt = notLookedAtNow;
      }
      this.narrowDown(selected, notLookedAt);
    } catch (error) {
      // The detector's model, or a request to the main process, fails a search as a whole (lookAt).
      logger.error('Faces could not be looked for, as the face detector or the main process failed.', error);
      this.showDialog({ kind: 'failed' });
    } finally {
      this.search = undefined;
    }
  }

  /** The dialog's Cancel: the search ends, and the selection stays as it was. */
  public cancel(): void {
    if (this.search)
      this.search.canceled = true;
  }

  /** Selects the photos with faces among `selected`, where the search could not look at those of `notLookedAt`. */
  private narrowDown(selected: readonly Photo[], notLookedAtPaths: ReadonlySet<string>): void {
    const withFaces = selected.filter(photo => this.outcomes.get(photo.path) === 'face');
    const notLookedAt = selected.filter(photo => notLookedAtPaths.has(photo.path)).length;
    logger.info(`Faces were found in ${withFaces.length} of the ${selected.length} selected photos; ${notLookedAt} could not be looked at.`);
    if (withFaces.length === 0) {
      this.showDialog({ kind: 'noFacesFound' });
      return;
    }
    this.selectionService.select(withFaces.map(photo => photo.path));
    if (notLookedAt > 0)
      this.showDialog({ kind: 'notLookedAt', count: notLookedAt });
    else
      this.closeDialog();
  }

  /**
   * Looks at the photos, keeping what is found, and gives those that it could not look at; undefined when the search
   * was canceled. Throws when the detector fails.
   * TL;DR: Two photos at a time; the first failure stops both, and the search ends once both have stopped.
   * Details: Whether a photo has a face is kept, also when it is found after Cancel, as it is true of the photo; not
   * after another folder opened, as the photo of the same path there may be another (folderNumber). A photo that could
   * not be looked at is not kept: the next search looks at it again.
   */
  private async lookAt(photos: readonly Photo[], search: Search): Promise<ReadonlySet<string> | undefined> {
    const startMs = performance.now();
    const folderNumber = this.folderNumber;
    let done = 0;
    let waiting = 0;
    const report = () => this.dialogStateValue.set({ kind: 'searching', done, total: photos.length, waitingForThumbnails: waiting > 0 });

    // The faces that the metadata marks, of the JPEG files, whose XMP the main process reads.
    for (const batch of chunk(photos.filter(photo => FilenameExtension.isJpeg(photo.filenameExtension)), maxFaceRegionPathsPerRequest)) {
      const haveRegions = await bridge().faceRegions.have(batch.map(photo => photo.path));
      if (search.canceled || folderNumber !== this.folderNumber)
        return undefined;
      batch.forEach((photo, index) => {
        if (haveRegions[index]) {
          this.outcomes.set(photo.path, 'face');
          done++;
        }
      });
      report();
    }

    // The others, the HEIF photos last, as their thumbnails may still be being made.
    const toDetect = photos.filter(photo => !this.outcomes.has(photo.path));
    const isHeif = (photo: Photo) => faceSearchImageKindOf(photo) === 'generatedThumbnail';
    const queue = [...toDetect.filter(photo => !isHeif(photo)), ...toDetect.filter(isHeif)];
    let next = 0;
    let failure: unknown;
    const notLookedAt = new Set<string>();
    const lookAtTheNext = async () => {
      try {
        while (next < queue.length && !search.canceled) {
          const photo = queue[next++];
          const outcome = await this.outcomeOf(photo, search, isWaiting => {
            waiting += isWaiting ? 1 : -1;
            report();
          });
          if (outcome === undefined || folderNumber !== this.folderNumber)
            return; // The search ended before the photo was looked at, or another folder opened meanwhile.
          if (outcome === 'failed')
            notLookedAt.add(photo.path);
          else
            this.outcomes.set(photo.path, outcome);
          done++;
          report();
        }
      } catch (error) {
        // The first failure ends the search, as Cancel does, so that the other photo's work stops too.
        failure ??= error;
        search.canceled = true;
      }
    };
    await Promise.all([lookAtTheNext(), lookAtTheNext()]);
    if (failure !== undefined)
      throw failure;
    if (search.canceled)
      return undefined;
    logger.info(`Looked for faces in ${photos.length} photos in ${Math.round(performance.now() - startMs)} ms.`);
    return notLookedAt;
  }

  /**
   * What is found in the photo: a face, none, or nothing when its image cannot be decoded or looked at. Undefined when
   * the search ends before the photo is looked at: while it waits for its thumbnail, or is decoded. Throws when the
   * detector's model fails.
   */
  private async outcomeOf(photo: Photo, search: Search, setWaiting: (isWaiting: boolean) => void): Promise<Outcome | undefined> {
    const kind = faceSearchImageKindOf(photo);
    let url: string;
    if (kind === 'none') {
      return 'failed';
    } else if (kind === 'generatedThumbnail') {
      const thumbnailFilePath = await this.generatedThumbnailOf(photo, search, setWaiting);
      if (thumbnailFilePath === undefined)
        return undefined;
      url = photoFileUrl(thumbnailFilePath);
    } else {
      url = faceSearchImageUrlOf(photo, kind);
    }

    let image: ImageBitmap;
    try {
      image = await this.imageDecoder.decode(url);
    } catch {
      return 'failed'; // As a file that was removed, or a thumbnail that could not be made.
    }
    if (search.canceled) {
      image.close();
      return undefined;
    }
    try {
      return await this.faceDetector.score(image) >= faceScoreThreshold ? 'face' : 'noFace';
    } catch (error) {
      if (error instanceof FaceDetectorError && error.stage === 'image')
        return 'failed';
      throw error;
    }
  }

  /**
   * The file of the thumbnail that the app makes of a HEIF photo, once the attempt to make it has finished (the file
   * is not there when it failed); undefined when the search is canceled meanwhile.
   */
  private async generatedThumbnailOf(photo: Photo, search: Search, setWaiting: (isWaiting: boolean) => void): Promise<string | undefined> {
    this.generatedThumbnailService.watch(photo.path);
    let filePath = this.generatedThumbnailService.filePathOf(photo.path);
    if (filePath !== undefined)
      return filePath;
    setWaiting(true);
    try {
      while (filePath === undefined && !search.canceled) {
        await new Promise(resolve => setTimeout(resolve, thumbnailWaitIntervalMs));
        filePath = this.generatedThumbnailService.filePathOf(photo.path);
      }
      return search.canceled ? undefined : filePath;
    } finally {
      setWaiting(false);
    }
  }

  private showDialog(state: FaceSearchDialogState): void {
    this.dialogStateValue.set(state);
    if (this.dialogRef)
      return;
    this.dialogRef = this.dialog.open<FaceSearchDialogComponent, FaceSearchDialogData>(FaceSearchDialogComponent, {
      data: { state: this.dialogState, cancel: () => this.cancel() },
      width: '480px',
      // At least its height in English; taller for texts that take more lines in another language.
      minHeight: '150px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
    });
    this.dialogRef.afterClosed().subscribe(() => this.dialogRef = undefined);
  }

  private closeDialog(): void {
    this.dialogRef?.close();
  }
}
