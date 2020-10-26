import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Logger } from '../../../../src-shared/log/logger';
import { isThumbnailCacheAvailable } from '../../../../src-shared/thumbnail/thumbnail-generation-util';
import { ThumbnailGenerationService } from '../service/thumbnail-generation.service';

@Component({
  selector: 'app-thumbnail-generation-status',
  templateUrl: './thumbnail-generation-status.component.html',
  styleUrls: ['./thumbnail-generation-status.component.scss']
})
export class ThumbnailGenerationStatusComponent implements OnInit {
  public isThumbnailGenerationDone = false;
  public numberOfTotalHeifFiles: number;
  public numberOfThumbnailsUsingCache: number;
  public numberOfThumbnailsGenerationRequired: number;
  public numberOfGeneratedThumbnails: number;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private thumbnailGenerationService: ThumbnailGenerationService) {
  }

  ngOnInit() {
    this.thumbnailGenerationService.thumbnailGenerationStarted.subscribe(status => {
      this.isThumbnailGenerationDone = false;
      this.numberOfTotalHeifFiles = status.numOfAllHeifFiles;
      this.numberOfThumbnailsGenerationRequired = status.generationRequiredFilePaths.length;
      this.numberOfThumbnailsUsingCache = this.numberOfTotalHeifFiles - this.numberOfThumbnailsGenerationRequired;
      this.numberOfGeneratedThumbnails = 0;
      Logger.info(`Total HEIF/HEIC files: ${ this.numberOfTotalHeifFiles }, Using cache: ${ this.numberOfThumbnailsUsingCache }, `
        + `Generation required: ${ this.numberOfThumbnailsGenerationRequired }`);
      this.updateThumbnailGenerationStatus(status.generationRequiredFilePaths);
    });
  }

  private updateThumbnailGenerationStatus(generationRequiredFilePaths: string[]) {
    const intervalId = setInterval(() => {
      this.numberOfGeneratedThumbnails = generationRequiredFilePaths.filter(filePath => isThumbnailCacheAvailable(filePath)).length;
      Logger.info(`Thumbnail generation progress (generated/generation-required): `
        + `${this.numberOfGeneratedThumbnails}/${this.numberOfThumbnailsGenerationRequired}`);
      if (this.numberOfGeneratedThumbnails === this.numberOfThumbnailsGenerationRequired) {
        this.isThumbnailGenerationDone = true;
        Logger.info(`Completed thumbnail generation.`);
        clearInterval(intervalId);
      }
      this.changeDetectorRef.detectChanges();
    }, 500);
  }
}
