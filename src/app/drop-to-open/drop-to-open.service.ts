import { inject, Service, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { bridge, OpenTarget } from '../../../src-shared/bridge/plm-bridge';
import { t } from '../../../src-shared/i18n/i18n';
import { logged, shown } from '../../../src-shared/log/logged-line';
import { Logger } from '../../../src-shared/log/logger';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { OpenableTarget, OpenTargetService } from '../shared/service/open-target.service';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';

/** Whether a drag carries files or folders, as one from Explorer or Finder does. */
function carriesFiles(event: DragEvent): boolean {
  return !!event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files');
}

function isOpenable(target: OpenTarget): target is OpenableTarget {
  return target.kind === 'file' || target.kind === 'directory';
}

/** The error of a path that the main process could not read, for the log; nothing for another target. */
function errorOf(target: OpenTarget): string {
  return target.kind === 'failed' ? target.message : '';
}

/**
 * Opens a folder or a file that the user drags from Explorer or Finder and drops on the window, once the user has
 * confirmed it, as --open opens the same path (OpenTargetService): the folder, or the folder of the file with the file
 * selected. AppComponent gives it the drag events of the whole window.
 * - The page takes a drag of files itself, so that the drop comes to it. The window would otherwise load the file in
 *   place of the application, which the main process prevents (src-main/ipc/main-window-pages.ts).
 * - The page gives the main process the File of the drop, never a path (src-shared/bridge/plm-bridge.ts). The folder
 *   becomes one that the page may read once the user has confirmed, as with the folder picker. A File that is not on
 *   the disk opens nothing.
 * - A drop is taken when Open Folder could be clicked: not while a dialog is open, as the loading dialog is while a
 *   folder loads, nor while thumbnails are generated, when Open Folder is disabled. The cursor then says that nothing
 *   can be dropped. Nor is one taken while another drop is still being opened.
 * - While a drop would be taken, a hint over the window says that the folder opens (DropHintComponent), for a file
 *   as for a folder: a file opens its folder too, and until the drop, the page knows only the type of what is dragged,
 *   which does not tell a folder from a file whose type the OS does not know.
 * - A drag that starts in the page, as a thumbnail's does, is left to the page: it is not one from Explorer or Finder.
 * - Of several items dropped at once, the first is opened, which the question names.
 */
@Service()
export class DropToOpenService {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly openTargetService = inject(OpenTargetService);
  private readonly thumbnailGenerationService = inject(ThumbnailGenerationService);

  /** Whether a drop is being asked about or opened. */
  private isOpeningDrop = false;

  private readonly isHintShown = signal(false);
  /** Whether the hint over the window is shown, which says that a drop opens the folder (DropHintComponent). */
  public readonly showsHint = this.isHintShown.asReadonly();

  /**
   * The elements that the files are dragged over, by their dragenter and dragleave: the drag is over the window while
   * there is one. A drag that moves to another element enters it before it leaves the one before.
   */
  private readonly enteredTargets = new Set<EventTarget>();

  /** Whether a drag that started in the page goes on. */
  private isDragFromPage = false;

  /** Whether a folder can be opened now, as Open Folder can be clicked. */
  private canOpenFolderNow(): boolean {
    return this.dialog.openDialogs.length === 0 && !this.thumbnailGenerationService.isGenerating();
  }

  /** Whether a drop is taken now. */
  private takesDropNow(): boolean {
    return !this.isOpeningDrop && this.canOpenFolderNow();
  }

  /** Whether the drag carries files from outside the page, as one from Explorer or Finder does. */
  private isDragOfFiles(event: DragEvent): boolean {
    return !this.isDragFromPage && carriesFiles(event);
  }

  /** For dragstart: the drag starts in the page, which keeps it, until it ends. */
  public dragStart(): void {
    this.isDragFromPage = true;
    // Its dragend is not seen when its element leaves the page meanwhile, as a row of the tree does when the tree
    // scrolls it far from the view. No mouse event comes while something is dragged, so the next one ends the drag.
    window.addEventListener('mousemove', this.endDragFromPage);
  }

  /** For dragend. */
  public dragEnd(): void {
    this.endDragFromPage();
  }

  private readonly endDragFromPage = () => {
    this.isDragFromPage = false;
    window.removeEventListener('mousemove', this.endDragFromPage);
  };

  /** For dragenter: takes a drag of files, as dragover does, and notes the element that it enters. */
  public dragEnter(event: DragEvent): void {
    if (!this.isDragOfFiles(event))
      return;
    if (event.target)
      this.enteredTargets.add(event.target);
    this.takeDrag(event);
  }

  /**
   * For dragover: takes a drag of files, with the copy cursor and the hint, or with the cursor that says no when
   * nothing can be opened now.
   */
  public dragOver(event: DragEvent): void {
    if (!this.isDragOfFiles(event))
      return;
    this.takeDrag(event);
  }

  /** For dragleave: the drag is over once it has left every element that it entered, as it does out of the window. */
  public dragLeave(event: DragEvent): void {
    if (!this.isDragOfFiles(event))
      return;
    if (event.target)
      this.enteredTargets.delete(event.target);
    // An element that leaves the page while the files are over it gets no dragleave.
    for (const target of this.enteredTargets) {
      if (!(target instanceof Node) || !target.isConnected)
        this.enteredTargets.delete(target);
    }
    if (this.enteredTargets.size === 0)
      this.endDrag();
  }

  private takeDrag(event: DragEvent): void {
    event.preventDefault();
    const takesDrop = this.takesDropNow();
    event.dataTransfer.dropEffect = takesDrop ? 'copy' : 'none';
    this.isHintShown.set(takesDrop);
    // No mouse event comes while files are dragged over the window, so the next one means that the drag is over,
    // whichever of its events was missed.
    window.addEventListener('mousemove', this.endDrag);
  }

  /** Hides the hint and forgets the elements that the drag entered. */
  private readonly endDrag = () => {
    this.enteredTargets.clear();
    this.isHintShown.set(false);
    window.removeEventListener('mousemove', this.endDrag);
  };

  /** For drop: opens the first of the dropped items, once the user has confirmed it; resolves when that is done. */
  public async drop(event: DragEvent): Promise<void> {
    if (!this.isDragOfFiles(event))
      return;
    event.preventDefault();
    this.endDrag();
    // The files of a drop can be read only while its event is dispatched.
    const files = Array.from(event.dataTransfer.files);
    if (!this.takesDropNow())
      return;
    if (files.length === 0) {
      Logger.info('[Drop to Open] The drop has no file.');
      return;
    }
    this.isOpeningDrop = true;
    try {
      await this.openDroppedItem(files[0], files.length);
    } finally {
      this.isOpeningDrop = false;
    }
  }

  private async openDroppedItem(file: File, itemCount: number): Promise<void> {
    // The main process finds out what the item is, by the path that the preload reads from the File.
    const target = await bridge().droppedItem.openTarget(file);
    if (!isOpenable(target)) {
      Logger.info(`[Drop to Open] Nothing to open for the dropped item: ${target.kind} ${errorOf(target)}`);
      Analytics.trackEvent('Drop to Open', 'Drop to Open: Nothing to Open', `Item Type: ${target.kind}`);
      return;
    }
    const itemType = target.kind === 'file' ? 'File' : 'Directory';
    Logger.info(`[Drop to Open] Asking whether to open "${target.path}". Items dropped: ${itemCount}.`);
    Analytics.trackEvent('Drop to Open', 'Drop to Open: Asked', `Item Type: ${itemType}`, itemCount);
    const question = target.kind === 'file' ? t('dropToOpen.openFile') : t('dropToOpen.openFolder');
    if (!await this.confirmDialogService.confirm(question, target.path)) {
      Logger.info('[Drop to Open] Canceled.');
      Analytics.trackEvent('Drop to Open', 'Drop to Open: Canceled', `Item Type: ${itemType}`);
      return;
    }
    if (!this.canOpenFolderNow()) {
      // Another dialog, or the thumbnails of a folder that --open gave, came while the question was asked.
      Logger.warn('[Drop to Open] Not opened, as a folder cannot be opened now.');
      return;
    }
    // The folder becomes one that the user chose only now. The main process looks at the path again.
    const chosen = await bridge().droppedItem.choose(file);
    if (!isOpenable(chosen)) {
      Logger.warn(
        logged`[Drop to Open] The dropped item can no longer be opened: ${shown(chosen.kind)} ${errorOf(chosen)}`);
      return;
    }
    await this.openTargetService.open(chosen, 'Drop to Open');
  }
}
