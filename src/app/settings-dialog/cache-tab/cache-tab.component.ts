import { Component, computed, inject, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { bridge } from '../../../../src-shared/bridge/plm-bridge';
import { currentLanguage, t } from '../../../../src-shared/i18n/i18n';
import { Logger } from '../../../../src-shared/log/logger';
import { maxCachedPlaces, WaybackDateCache } from '../../map/leaflet-map/dated-layers/wayback-date-cache';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

/** A count, as the application's language writes numbers. */
function formatted(count: number): string {
  return new Intl.NumberFormat(currentLanguage).format(count);
}

/**
 * The Cache tab of the settings dialog: each cache of the application, and the deleting of all of them.
 * TL;DR: The cache of the thumbnails is on the Thumbnails tab (CacheSettingsComponent), which this opens. The cache of
 * the dates of the map's imagery (WaybackDateCache) is counted and deleted here. Both are deleted at once here.
 * Details:
 * - Deleting the map's cache, once the user confirms, needs no restart: the map asks Wayback again for the places
 *   looked at.
 * - Deleting all of them deletes the map's first, then has the main process delete the thumbnails' and restart the
 *   app, as Delete Thumbnail Cache does.
 */
@Component({
  selector: 'app-cache-tab',
  templateUrl: './cache-tab.component.html',
  styleUrls: ['./cache-tab.component.scss'],
  imports: [MatButton, TranslatePipe],
})
export class CacheTabComponent {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly waybackDateCache = inject(WaybackDateCache);

  /** The link to the Thumbnails tab was clicked. */
  public readonly openThumbnailsTab = output<void>();
  /** How many places the map's cache keeps, once they are counted. */
  protected readonly mapPlaces = signal<number | null>(null);
  protected readonly mapDescription = t('settings.cacheTab.map.description', { max: formatted(maxCachedPlaces) });
  protected readonly mapCount = computed(() => {
    const count = this.mapPlaces();
    return count === null ? '' : t('settings.cacheTab.map.count', { count: formatted(count) });
  });

  constructor() {
    this.waybackDateCache.count().then(count => this.mapPlaces.set(count));
  }

  /** Once the user confirms, forgets the dates of the map's imagery, which the map asks Wayback for again. */
  public async deleteMapCache(): Promise<void> {
    const isOkPressed = await this.confirmDialogService.confirm(t('settings.cacheTab.map.confirmDelete'));
    if (!isOkPressed)
      return;
    Logger.info('Delete the map cache.');
    await this.waybackDateCache.clear();
    this.mapPlaces.set(0);
  }

  /** Once the user confirms, deletes the map's cache, then has the main process delete the thumbnails' and restart. */
  public async deleteAllCaches(): Promise<void> {
    const isOkPressed = await this.confirmDialogService.confirm(t('settings.cacheTab.all.confirmDelete'));
    if (!isOkPressed)
      return;
    Logger.info('Delete all caches, which restarts the application.');
    await this.waybackDateCache.clear();
    // The main process empties the thumbnails' cache, then restarts the app, which ends this page.
    bridge().thumbnailCache.deleteAndRestart()
      .catch(error => Logger.error('Failed to delete the thumbnail cache.', error));
  }
}
