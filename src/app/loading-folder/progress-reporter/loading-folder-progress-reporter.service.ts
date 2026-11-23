import { signal, Service } from '@angular/core';
import { Logger } from '../../../../src-shared/log/logger';
import { LoadingFolderProgress as progress } from '../../shared/loading-folder-progress';

export interface LoadingFolderProgressStatus {
  readonly numberOfLoadedFiles: number;
  readonly numberOfAllFilesToLoad: number;
  readonly loadedPercent: number;
  readonly isStarted: boolean;
  readonly isInProgress: boolean;
  readonly isCompleted: boolean;
}

export const notStartedLoadingFolderProgressStatus: LoadingFolderProgressStatus = {
  numberOfLoadedFiles: 0,
  numberOfAllFilesToLoad: 0,
  loadedPercent: 0,
  isStarted: false,
  isInProgress: false,
  isCompleted: false,
};

/** How often the progress is reported while the folder loads. */
const updateMilliseconds = 100;

/** Whether two statuses show the same progress: the status signal's equality, so that an update to the same one notifies no one. */
function isSameStatus(a: LoadingFolderProgressStatus, b: LoadingFolderProgressStatus): boolean {
  return a.numberOfLoadedFiles === b.numberOfLoadedFiles && a.numberOfAllFilesToLoad === b.numberOfAllFilesToLoad
    && Object.is(a.loadedPercent, b.loadedPercent)
    && a.isStarted === b.isStarted && a.isInProgress === b.isInProgress && a.isCompleted === b.isCompleted;
}

@Service()
export class LoadingFolderProgressReporterService {
  // Compared field by field, so that the dialog renders only when the progress changes, not on every update.
  private readonly statusState = signal(notStartedLoadingFolderProgressStatus, { equal: isSameStatus });
  /** The progress of loading the opened folder, which the loading-folder dialog shows. */
  public readonly status = this.statusState.asReadonly();
  /** The next report, until loading has completed. */
  private timerId: ReturnType<typeof setTimeout> | undefined;

  /**
   * Starts reporting the progress of the folder being opened: first that its files are being collected, then the
   * progress, at once and every 100 ms until it has loaded. Stops reporting that of the previous folder if it never
   * finished.
   * TL;DR: The dialog of a new folder starts from collecting its files, not from where the previous folder ended. Its
   * first report comes right after, rather than 100 ms after, so that the dialog of a folder whose photos were read
   * before the dialog was made also says that loading completed before the open closes it.
   * Details: The photos of a small folder are read within a few milliseconds, as the thumbnails of their EXIF data are
   * no longer turned on a canvas, which waited for a frame. The open closed the dialog before its first report, while
   * it still said that it collected the files.
   */
  public startUpdatingProgress(): void {
    Logger.info('[Loading Folder] Collecting files to load from the opened folder...');
    clearTimeout(this.timerId);
    this.statusState.set(notStartedLoadingFolderProgressStatus);
    const report = () => {
      this.reportProgress();
      if (!this.status().isCompleted)
        this.timerId = setTimeout(report, updateMilliseconds);
    };
    this.timerId = setTimeout(report, 0);
  }

  /**
   * Reports the progress as it is now, and stops the reports once loading has completed.
   * TL;DR: The open asks for it too, once the folder's photos are read, so that the dialog says that loading completed
   * during the 100 ms that the open waits for it (OpenFolderService), whichever moment between two reports that is.
   */
  public reportProgress(): void {
    const status: LoadingFolderProgressStatus = {
      numberOfLoadedFiles: progress.numberOfLoadedFiles,
      numberOfAllFilesToLoad: progress.numberOfAllFilesToLoad,
      loadedPercent: progress.loadedPercent,
      isStarted: progress.isStarted,
      isInProgress: progress.isInProgress,
      isCompleted: progress.isCompleted,
    };

    if (status.isStarted) {
      Logger.info(`[Loading Folder] Loaded ${status.numberOfLoadedFiles} files out of ${status.numberOfAllFilesToLoad} files.`);
    }

    this.statusState.set(status);

    if (status.isCompleted) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }
}
