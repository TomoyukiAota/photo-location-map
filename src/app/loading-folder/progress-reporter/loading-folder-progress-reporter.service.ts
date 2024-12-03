import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { LoadingFolderProgress as progress } from '../../shared/loading-folder-progress';

interface LoadingFolderProgressStatus {
  numberOfLoadedFiles: number;
  numberOfAllFilesToLoad: number;
  loadedPercent: number;
  isStarted: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingFolderProgressReporterService {
  public progressStatus = new Subject<LoadingFolderProgressStatus>();

  public startUpdatingProgress(): void {
    Logger.info('[Loading Folder] Collecting files to load from the opened folder...');
    const updateMilliseconds = 100;
    const intervalId = setInterval(() => {
      const numberOfLoadedFiles = progress.numberOfLoadedFiles;
      const numberOfAllFilesToLoad = progress.numberOfAllFilesToLoad;
      const loadedPercent = progress.loadedPercent;
      const isStarted = progress.isStarted;
      const isInProgress = progress.isInProgress;
      const isCompleted = progress.isCompleted;

      if (isStarted) {
        Logger.info(`[Loading Folder] Loaded ${numberOfLoadedFiles} files out of ${numberOfAllFilesToLoad} files.`);
      }

      this.progressStatus.next({
        numberOfLoadedFiles,
        numberOfAllFilesToLoad,
        loadedPercent,
        isStarted,
        isInProgress,
        isCompleted,
      });

      if (isCompleted) {
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }
}
