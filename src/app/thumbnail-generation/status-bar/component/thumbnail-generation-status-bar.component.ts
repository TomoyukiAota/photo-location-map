import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../../src-shared/log/logger';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import {
  ThumbnailGenerationErrorDialogComponent
} from '../../error-dialog/thumbnail-generation-error-dialog.component';
import { ThumbnailGenerationService } from '../../service/thumbnail-generation.service';
import { ThumbnailGenerationStatusBarService } from '../service/thumbnail-generation-status-bar.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-thumbnail-generation-status-bar',
  templateUrl: './thumbnail-generation-status-bar.component.html',
  styleUrls: ['./thumbnail-generation-status-bar.component.scss'],
  imports: [MatProgressBar, MatIcon, TranslatePipe]
})
export class ThumbnailGenerationStatusBarComponent {
  private dialog = inject(MatDialog);
  private thumbnailGenerationService = inject(ThumbnailGenerationService);
  private thumbnailGenerationStatusBarService = inject(ThumbnailGenerationStatusBarService);

  public readonly status = this.thumbnailGenerationService.status;
  public readonly detailsVisible = this.thumbnailGenerationStatusBarService.detailsVisible;

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
    this.thumbnailGenerationStatusBarService.toggleDetails();
  }

  public handleCloseButtonClicked() {
    this.thumbnailGenerationStatusBarService.hide();
  }
}
