import { Component, OnInit, computed } from '@angular/core';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { LoadingFolderProgressReporterService } from '../progress-reporter/loading-folder-progress-reporter.service';

@Component({
  selector: 'app-loading-folder-dialog',
  templateUrl: './loading-folder-dialog.component.html',
  styleUrls: ['./loading-folder-dialog.component.scss'],
  standalone: false
})
export class LoadingFolderDialogComponent implements OnInit {
  public readonly status = this.loadingFolderProgress.status;
  public readonly progressBarMode = computed<ProgressBarMode>(() => this.status().isStarted ? 'buffer' : 'query');

  constructor(private loadingFolderProgress: LoadingFolderProgressReporterService) { }

  ngOnInit() {
    this.loadingFolderProgress.startUpdatingProgress();
  }
}
