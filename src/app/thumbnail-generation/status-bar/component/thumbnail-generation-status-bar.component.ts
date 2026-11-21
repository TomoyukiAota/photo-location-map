import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../../src-shared/log/logger';
import { currentUserSettings } from '../../../../../src-shared/user-settings/user-settings';
import { SettingsDialogService } from '../../../settings-dialog/service/settings-dialog.service';
import { TagPartsPipe } from '../../../shared/i18n/tag-parts.pipe';
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
  imports: [MatProgressBar, MatIcon, TranslatePipe, TagPartsPipe]
})
export class ThumbnailGenerationStatusBarComponent {
  private dialog = inject(MatDialog);
  private thumbnailGenerationService = inject(ThumbnailGenerationService);
  private thumbnailGenerationStatusBarService = inject(ThumbnailGenerationStatusBarService);
  private settingsDialogService = inject(SettingsDialogService);

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

  /** Whether the thumbnails are of high quality, the slower: the bar offers the fast ones while they are made. */
  public isHighQuality(): boolean {
    return currentUserSettings.thumbnailQuality === 'high';
  }

  public handleThumbnailSettingsLinkClicked(event: MouseEvent) {
    event.stopPropagation();
    this.settingsDialogService.open('thumbnails');
    Analytics.trackEvent('Thumbnail Generation Status Bar', '[ThumbGen Status Bar] Open Thumbnail Settings');
  }

  public toggleDetailsVisibility() {
    this.thumbnailGenerationStatusBarService.toggleDetails();
  }

  public handleCloseButtonClicked() {
    this.thumbnailGenerationStatusBarService.hide();
  }
}
