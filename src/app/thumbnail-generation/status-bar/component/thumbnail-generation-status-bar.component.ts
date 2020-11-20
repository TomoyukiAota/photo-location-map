import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Logger } from '../../../../../src-shared/log/logger';
import { isThumbnailCacheAvailable } from '../../../../../src-shared/thumbnail-cache/thumbnail-cache-util';
import { ThumbnailGenerationService } from '../../service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../service/thumbnail-generation-status-bar.service';

@Component({
  selector: 'app-thumbnail-generation-status-bar',
  templateUrl: './thumbnail-generation-status-bar.component.html',
  styleUrls: ['./thumbnail-generation-status-bar.component.scss']
})
export class ThumbnailGenerationStatusBarComponent implements OnInit {
  public isThumbnailGenerationDone: boolean;
  public numberOfTotalHeifFiles: number;
  public numberOfThumbnailsUsingCache: number;
  public numberOfThumbnailsGenerationRequired: number;
  public numberOfGeneratedThumbnails: number;
  public progressPercent: number;
  public detailsVisible: boolean;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private thumbnailGenerationService: ThumbnailGenerationService,
              private thumbnailGenerationStatusBarService: ThumbnailGenerationStatusBarService) {
  }

  ngOnInit() {
    this.thumbnailGenerationService.thumbnailGenerationStarted.subscribe(status => {
      this.isThumbnailGenerationDone = false;
      this.numberOfTotalHeifFiles = status.numOfAllHeifFiles;
      this.numberOfThumbnailsGenerationRequired = status.generationRequiredFilePaths.length;
      this.numberOfThumbnailsUsingCache = this.numberOfTotalHeifFiles - this.numberOfThumbnailsGenerationRequired;
      this.numberOfGeneratedThumbnails = 0;
      this.progressPercent = 0;
      this.detailsVisible = false;
    });

    this.thumbnailGenerationService.thumbnailGenerationInProgress.subscribe(status => {
      this.numberOfGeneratedThumbnails = status.numberOfGeneratedThumbnails;
      this.progressPercent = status.progressPercent;
      this.changeDetectorRef.detectChanges();
    });

    this.thumbnailGenerationService.thumbnailGenerationDone.subscribe(() => {
      this.isThumbnailGenerationDone = true;
      this.changeDetectorRef.detectChanges();
    });
  }

  public toggleDetailsVisibility() {
    this.detailsVisible = !this.detailsVisible;
  }

  public handleCloseButtonClicked() {
    this.thumbnailGenerationStatusBarService.closeRequested.next();
  }
}
