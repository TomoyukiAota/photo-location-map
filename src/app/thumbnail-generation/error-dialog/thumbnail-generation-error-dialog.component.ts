import { Component, computed, inject } from '@angular/core';
import { ThumbnailGenerationService } from '../service/thumbnail-generation.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { ThumbnailGenerationErrorTableComponent } from './table/thumbnail-generation-error-table.component';
import { MatButton } from '@angular/material/button';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-thumbnail-generation-error-dialog',
  templateUrl: './thumbnail-generation-error-dialog.component.html',
  styleUrl: './thumbnail-generation-error-dialog.component.scss',
  imports: [ThumbnailGenerationErrorTableComponent, MatButton, MatDialogClose, TranslatePipe]
})
export class ThumbnailGenerationErrorDialogComponent {
  private thumbnailGenerationService = inject(ThumbnailGenerationService);

  public readonly numberOfFilesWithoutThumbnail = computed(() =>
    this.thumbnailGenerationService.status().result?.filePathsWithoutThumbnail.length ?? 0);
}
