import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { LoadingFolderProgress as progress } from '../../shared/loading-folder-progress';

interface LoadingFolderProgressStatus {
  numberOfLoadedFiles: number;
  numberOfAllFilesToLoad: number;
  loadedPercent: number;
  isValid: boolean;
  isCompleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingFolderProgressReporterService {
  public progressStatus = new Subject<LoadingFolderProgressStatus>();

  public startUpdatingProgress(): void {
    const updateMilliseconds = 100;
    const intervalId = setInterval(() => {
      const numberOfLoadedFiles = progress.numberOfLoadedFiles;
      const numberOfAllFilesToLoad = progress.numberOfAllFilesToLoad;
      const loadedPercent = numberOfLoadedFiles / numberOfAllFilesToLoad * 100;
      const isValid = numberOfAllFilesToLoad !== 0;
      const isCompleted = isValid && numberOfLoadedFiles === numberOfAllFilesToLoad;
      Logger.info(`[Loading Folder] Loaded ${numberOfLoadedFiles} files out of ${numberOfAllFilesToLoad} files.`);
      this.progressStatus.next({
        isValid,
        numberOfLoadedFiles,
        numberOfAllFilesToLoad,
        loadedPercent,
        isCompleted,
      });

      if (isCompleted) {
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }
}
