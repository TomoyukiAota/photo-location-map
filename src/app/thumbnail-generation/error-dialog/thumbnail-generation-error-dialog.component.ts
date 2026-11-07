import { Component, computed } from '@angular/core';
import { ThumbnailGenerationService } from '../service/thumbnail-generation.service';

@Component({
  selector: 'app-thumbnail-generation-error-dialog',
  templateUrl: './thumbnail-generation-error-dialog.component.html',
  styleUrl: './thumbnail-generation-error-dialog.component.scss',
  standalone: false
})
export class ThumbnailGenerationErrorDialogComponent {
  public readonly numberOfFilesWithoutThumbnail = computed(() =>
    this.thumbnailGenerationService.status().result?.filePathsWithoutThumbnail.length ?? 0);

  constructor(private thumbnailGenerationService: ThumbnailGenerationService) {
  }
}
