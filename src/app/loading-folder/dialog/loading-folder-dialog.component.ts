import { Component, OnInit } from '@angular/core';
import { LoadingFolderProgressReporterService } from '../progress-reporter/loading-folder-progress-reporter.service';

@Component({
  selector: 'app-loading-folder-dialog',
  templateUrl: './loading-folder-dialog.component.html',
  styleUrls: ['./loading-folder-dialog.component.scss']
})
export class LoadingFolderDialogComponent implements OnInit {
  public isProgressValid = false;
  public numberOfAllFilesToLoad = 0;
  public numberOfLoadedFiles = 0;
  public progressPercent = 0;

  constructor(private progressService: LoadingFolderProgressReporterService) { }

  ngOnInit() {
    this.progressService.progressStatus.subscribe(status => {
      this.isProgressValid = status.isValid;
      this.numberOfAllFilesToLoad = status.numberOfAllFilesToLoad;
      this.numberOfLoadedFiles = status.numberOfLoadedFiles;
      this.progressPercent = status.isValid ? status.loadedPercent : 0; // when invalid, progressPercent is 0 for display purpose.
    });
    this.progressService.startUpdatingProgress();
  }
}
