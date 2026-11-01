import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ThumbnailGenerationService } from '../service/thumbnail-generation.service';

@Component({
  selector: 'app-thumbnail-generation-error-dialog',
  templateUrl: './thumbnail-generation-error-dialog.component.html',
  styleUrl: './thumbnail-generation-error-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class ThumbnailGenerationErrorDialogComponent implements OnInit {
  public numberOfFilesWithoutThumbnail: number;

  constructor(private thumbnailGenerationService: ThumbnailGenerationService) {
  }

  public ngOnInit() {
    this.numberOfFilesWithoutThumbnail = this.thumbnailGenerationService.thumbnailGenerationResult.filePathsWithoutThumbnail.length;
  }
}
