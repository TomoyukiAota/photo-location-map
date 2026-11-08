import { Component, OnInit, computed, inject } from '@angular/core';
import { ProgressBarMode, MatProgressBar } from '@angular/material/progress-bar';
import { LoadingFolderProgressReporterService } from '../progress-reporter/loading-folder-progress-reporter.service';

@Component({
  selector: 'app-loading-folder-dialog',
  templateUrl: './loading-folder-dialog.component.html',
  styleUrls: ['./loading-folder-dialog.component.scss'],
  imports: [MatProgressBar]
})
export class LoadingFolderDialogComponent implements OnInit {
  private loadingFolderProgress = inject(LoadingFolderProgressReporterService);

  public readonly status = this.loadingFolderProgress.status;
  public readonly progressBarMode = computed<ProgressBarMode>(() => this.status().isStarted ? 'buffer' : 'query');

  ngOnInit() {
    this.loadingFolderProgress.startUpdatingProgress();
  }
}
