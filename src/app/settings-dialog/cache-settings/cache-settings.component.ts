import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { bridge } from '../../../../src-shared/bridge/plm-bridge';
import { currentLanguage, t } from '../../../../src-shared/i18n/i18n';
import { Logger } from '../../../../src-shared/log/logger';
import { startupMetadata } from '../../../../src-shared/startup/startup-metadata';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TagPartsPipe } from '../../shared/i18n/tag-parts.pipe';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { configureOpeningInOsBrowser } from '../../shared/open-url/configure-opening-in-os-browser';
import { MatButton } from '@angular/material/button';

/**
 * The cache of the thumbnails that are made, on the Thumbnails tab under their quality (ThumbnailSettingsComponent):
 * which files it is for, where it is, and deleting it, which restarts the app.
 */
@Component({
  selector: 'app-cache-settings',
  templateUrl: './cache-settings.component.html',
  styleUrls: ['./cache-settings.component.scss'],
  imports: [MatButton, TranslatePipe, TagPartsPipe]
})
export class CacheSettingsComponent implements AfterViewInit {
  private confirmDialogService = inject(ConfirmDialogService);

  public thumbnailCacheLocation = startupMetadata().thumbnailCacheDir;

  protected readonly thumbnailCacheSize = signal(t('settings.cache.sizeLoading'));

  public readonly heifWikipediaLink = viewChild.required<ElementRef<HTMLAnchorElement>>('heifWikipediaLink');

  ngAfterViewInit() {
    configureOpeningInOsBrowser(this.heifWikipediaLink(), 'https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format',
                                'HEIF page in Wikipedia', 'Settings Dialog] [Cache');
    void this.updateThumbnailCacheSize();
  }

  private async updateThumbnailCacheSize(): Promise<void> {
    try {
      const bytes = await bridge().thumbnailCache.size();
      this.thumbnailCacheSize.set(formatCacheSize(bytes));
    } catch (error) {
      Logger.error('Failed to calculate the thumbnail cache size.', error);
      this.thumbnailCacheSize.set(t('settings.cache.sizeUnavailable'));
    }
  }

  /** The main process makes the folder if it is not there, then opens it with the OS. */
  public openThumbnailCacheLocation(): void {
    Logger.info(`Open Thumbnail Cache Location: ${this.thumbnailCacheLocation}`);
    bridge().thumbnailCache.open()
      .catch(error => Logger.error(`Failed to open the thumbnail cache location.`, error));
  }

  /** Once the user confirms, has the main process delete the thumbnail cache and restart the app. */
  public async handleDeleteThumbnailCacheButtonClicked() {
    const isOkPressed = await this.confirmDialogService.confirm(t('settings.cache.confirmDelete'));
    if (!isOkPressed)
      return;

    // The main process empties the cache, then restarts the app, which ends this page.
    bridge().thumbnailCache.deleteAndRestart()
      .catch(error => Logger.error(`Failed to delete the thumbnail cache.`, error));
  }
}

function formatCacheSize(bytes: number): string {
  const megabytes = bytes / 1_000_000;
  const useGigabytes = megabytes >= 1000;
  return new Intl.NumberFormat(currentLanguage, {
    style: 'unit',
    unit: useGigabytes ? 'gigabyte' : 'megabyte',
    unitDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(useGigabytes ? megabytes / 1000 : megabytes);
}
