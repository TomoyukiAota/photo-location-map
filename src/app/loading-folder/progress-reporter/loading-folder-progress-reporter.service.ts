import { Injectable, signal } from '@angular/core';
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

function isSameStatus(a: LoadingFolderProgressStatus, b: LoadingFolderProgressStatus): boolean {
  return a.numberOfLoadedFiles === b.numberOfLoadedFiles && a.numberOfAllFilesToLoad === b.numberOfAllFilesToLoad
    && Object.is(a.loadedPercent, b.loadedPercent)
    && a.isStarted === b.isStarted && a.isInProgress === b.isInProgress && a.isCompleted === b.isCompleted;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingFolderProgressReporterService {
  // Compared field by field, so that the dialog renders only when the progress changes, not on every update.
  private readonly statusState = signal(notStartedLoadingFolderProgressStatus, { equal: isSameStatus });
  /** The progress of loading the opened folder, which the loading-folder dialog shows. */
  public readonly status = this.statusState.asReadonly();
  private intervalId: ReturnType<typeof setInterval> | undefined;

  public startUpdatingProgress(): void {
    Logger.info('[Loading Folder] Collecting files to load from the opened folder...');
    // The dialog of a new folder starts from collecting the files, not from where the previous folder ended.
    clearInterval(this.intervalId);
    this.statusState.set(notStartedLoadingFolderProgressStatus);

    const updateMilliseconds = 100;
    this.intervalId = setInterval(() => {
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
        clearInterval(this.intervalId);
      }
    }, updateMilliseconds);
  }
}
