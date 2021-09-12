import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { LoadingFolderProgress as progress } from '../../shared/loading-folder-progress';

@Injectable({
  providedIn: 'root'
})
export class LoadingFolderProgressReporterService {
  public progressStatus = new Subject<{numberOfLoadedFiles: number, numberOfAllFilesToLoad: number, loadedPercent: number, isValid: boolean}>();

  constructor() { }

  public startUpdatingProgress(): void {
    const updateMilliseconds = 1000;
    const intervalId = setInterval(() => {
      const numberOfLoadedFiles = progress.numberOfLoadedFiles;
      const numberOfAllFilesToLoad = progress.numberOfAllFilesToLoad;
      const loadedPercent = numberOfLoadedFiles / numberOfAllFilesToLoad * 100;
      const isValid = numberOfAllFilesToLoad !== 0;
      Logger.info(`[Loading Folder] Loaded ${numberOfLoadedFiles} files out of ${numberOfAllFilesToLoad} files.`);
      this.progressStatus.next({
        isValid,
        numberOfLoadedFiles,
        numberOfAllFilesToLoad,
        loadedPercent,
      });

      if (numberOfLoadedFiles === numberOfAllFilesToLoad) {
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }
}
