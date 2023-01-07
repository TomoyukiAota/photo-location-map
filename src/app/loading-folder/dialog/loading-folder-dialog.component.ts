import { Component, OnInit } from '@angular/core';
import { LegacyProgressBarMode as ProgressBarMode } from '@angular/material/legacy-progress-bar';
import { LoadingFolderProgressReporterService } from '../progress-reporter/loading-folder-progress-reporter.service';

@Component({
  selector: 'app-loading-folder-dialog',
  templateUrl: './loading-folder-dialog.component.html',
  styleUrls: ['./loading-folder-dialog.component.scss']
})
export class LoadingFolderDialogComponent implements OnInit {
  public progressBarMode: ProgressBarMode = 'query';
  public numberOfAllFilesToLoad = 0;
  public numberOfLoadedFiles = 0;
  public progressPercent = 0;
  public isLoadingFilesStarted = false;
  public isLoadingFilesInProgress = false;
  public isLoadingFilesCompleted = false;

  constructor(private loadingFolderProgress: LoadingFolderProgressReporterService) { }

  ngOnInit() {
    this.loadingFolderProgress.progressStatus.subscribe(status => {
      this.progressBarMode = status.isStarted ? 'buffer' : 'query';
      this.numberOfAllFilesToLoad = status.numberOfAllFilesToLoad;
      this.numberOfLoadedFiles = status.numberOfLoadedFiles;
      this.progressPercent = status.loadedPercent;
      this.isLoadingFilesStarted = status.isStarted;
      this.isLoadingFilesInProgress = status.isInProgress;
      this.isLoadingFilesCompleted = status.isCompleted;
    });
    this.loadingFolderProgress.startUpdatingProgress();
  }
}
