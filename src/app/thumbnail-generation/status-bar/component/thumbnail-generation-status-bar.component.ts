import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
    this.thumbnailGenerationService.generationStarted.subscribe(status => {
      this.isThumbnailGenerationDone = false;
      this.numberOfTotalHeifFiles = status.numOfAllHeifFiles;
      this.numberOfThumbnailsUsingCache = status.numOfCacheAvailableThumbnails;
      this.numberOfThumbnailsGenerationRequired = status.numOfGenerationRequiredThumbnails;
      this.numberOfGeneratedThumbnails = 0;
      this.progressPercent = 0;
      this.detailsVisible = false;
    });

    this.thumbnailGenerationService.generationProgress.subscribe(status => {
      this.numberOfGeneratedThumbnails = status.numOfGeneratedThumbnails;
      this.progressPercent = status.progressPercent;
      this.changeDetectorRef.detectChanges();
    });

    this.thumbnailGenerationService.generationDone.subscribe(() => {
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
