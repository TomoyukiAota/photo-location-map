import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Logger } from '../../../../src-shared/log/logger';
import { LoadingFolderProgress as progress } from '../../shared/loading-folder-progress';

@Injectable({
  providedIn: 'root'
})
export class LoadingFolderProgressReporterService {
  public progressStatus = new Subject<{numberOfLoadedFiles: number, numberOfAllFilesToLoad: number}>();

  constructor() { }

  public startUpdatingProgress(): void {
    const updateMilliseconds = 1000;
    const intervalId = setInterval(() => {
      const numberOfLoadedFiles = progress.numberOfLoadedFiles;
      const numberOfAllFilesToLoad = progress.numberOfAllFilesToLoad;
      Logger.infoWithoutAppendingFile(`[Loading Folder] Loaded ${numberOfLoadedFiles} files out of ${numberOfAllFilesToLoad} files.`);
      this.progressStatus.next({numberOfLoadedFiles: numberOfLoadedFiles, numberOfAllFilesToLoad: numberOfAllFilesToLoad});

      if (numberOfLoadedFiles === numberOfAllFilesToLoad) {
        clearInterval(intervalId);
      }
    }, updateMilliseconds);
  }
}
