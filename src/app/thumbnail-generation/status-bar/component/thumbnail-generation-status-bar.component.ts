import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../../src-shared/log/logger';
import {
  ThumbnailGenerationErrorDialogComponent
} from '../../error-dialog/thumbnail-generation-error-dialog.component';
import { ThumbnailGenerationResult, ThumbnailGenerationService } from '../../service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../service/thumbnail-generation-status-bar.service';

@Component({
  selector: 'app-thumbnail-generation-status-bar',
  templateUrl: './thumbnail-generation-status-bar.component.html',
  styleUrls: ['./thumbnail-generation-status-bar.component.scss']
})
export class ThumbnailGenerationStatusBarComponent implements OnInit {
  public isThumbnailGenerationDone: boolean;
  public thumbnailGenerationResult: ThumbnailGenerationResult;
  public numberOfTotalHeifFiles: number;
  public numberOfThumbnailsUsingCache: number;
  public numberOfThumbnailsGenerationRequired: number;
  public numberOfProcessedThumbnails: number;
  public progressPercent: number;
  public detailsVisible: boolean;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private dialog: MatDialog,
              private thumbnailGenerationService: ThumbnailGenerationService,
              private thumbnailGenerationStatusBarService: ThumbnailGenerationStatusBarService) {
  }

  public ngOnInit() {
    this.thumbnailGenerationService.generationStarted.subscribe(status => {
      this.isThumbnailGenerationDone = false;
      this.numberOfTotalHeifFiles = status.numOfAllHeifFiles;
      this.numberOfThumbnailsUsingCache = status.numOfCacheAvailableThumbnails;
      this.numberOfThumbnailsGenerationRequired = status.numOfGenerationRequiredThumbnails;
      this.numberOfProcessedThumbnails = 0;
      this.progressPercent = 0;
      this.detailsVisible = false;
    });

    this.thumbnailGenerationService.generationProgress.subscribe(status => {
      this.numberOfProcessedThumbnails = status.numOfProcessedThumbnails;
      this.progressPercent = status.progressPercent;
      this.changeDetectorRef.detectChanges();
    });

    this.thumbnailGenerationService.generationDone.subscribe(result => {
      this.isThumbnailGenerationDone = true;
      this.thumbnailGenerationResult = result;
      this.changeDetectorRef.detectChanges();
    });
  }

  public handleClickHereTextClicked(event: MouseEvent) {
    event.stopPropagation();
    this.dialog.open(ThumbnailGenerationErrorDialogComponent, {
      width: '1000px',
      height: '600px',
      panelClass: 'custom-dialog-container',
      disableClose: false,
      autoFocus: false,
      restoreFocus: false
    });
    Logger.info('[Thumbnail Generation Status Bar] The text "Click here to see the files with errors." is clicked.');
    Analytics.trackEvent('Thumbnail Generation Status Bar', '[ThumbGen Status Bar] Open Error Dialog');
  }

  public toggleDetailsVisibility() {
    this.detailsVisible = !this.detailsVisible;
  }

  public handleCloseButtonClicked() {
    this.thumbnailGenerationStatusBarService.closeRequested.next();
  }
}
