import { computed, Service, signal } from '@angular/core';
import { ThumbnailQuality } from '../../../../src-shared/user-settings/thumbnail-quality';
import {
  madeThumbnailLongerSide,
  shownThumbnailSize,
  thumbnailBoxOf,
  ThumbnailSizes,
} from '../../../../src-shared/user-settings/thumbnail-size';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

/**
 * The quality and the sizes of the thumbnails as the settings have them, for what the page shows and makes: signals, as
 * the settings are not one, so that the views follow a new setting once it is saved (follow()).
 * TL;DR: The sidebar's folder tree and the map's popups each show a thumbnail in a box of half the size that the
 * sliders of the Thumbnails tab choose for them, in CSS pixels, and the app makes the thumbnails at the larger of the two
 * sizes (src-shared/user-settings/thumbnail-size.ts).
 * Details: The boxes are CSS custom properties that the application's root element has (AppComponent), which every
 * photo's viewer reads in its styles, by its place: nothing of the sizes is bound in each viewer, of which there is one
 * for every photo of the tree (PhotoInfoViewerComponent).
 */
@Service()
export class ThumbnailSizeService {
  private readonly settings = signal(settingsNow());

  public readonly quality = computed<ThumbnailQuality>(() => this.settings().quality);
  /** The longer side of the thumbnails that the app makes from the photos, in pixels. */
  public readonly longerSide = computed(() => madeThumbnailLongerSide(this.settings().quality, this.settings().sizes));
  /** The box of a thumbnail in the folder tree of the sidebar, as CSS takes it. */
  public readonly sidebarBox = computed(() => boxOf(this.settings().quality, this.settings().sizes.sidebar));
  /** The box of a thumbnail in the map's popups, as CSS takes it. */
  public readonly mapBox = computed(() => boxOf(this.settings().quality, this.settings().sizes.map));

  /**
   * Follows the settings as they were saved. Returns whether the thumbnails that the app makes change, as their quality
   * or their size does, rather than only the box of a place, which follows by itself.
   */
  public follow(): boolean {
    const previousQuality = this.quality();
    const previousLongerSide = this.longerSide();
    this.settings.set(settingsNow());
    return this.quality() !== previousQuality || this.longerSide() !== previousLongerSide;
  }
}

function settingsNow(): { quality: ThumbnailQuality, sizes: ThumbnailSizes } {
  return {
    quality: currentUserSettings.thumbnailQuality,
    sizes: { sidebar: currentUserSettings.sidebarThumbnailSize, map: currentUserSettings.mapThumbnailSize },
  };
}

function boxOf(quality: ThumbnailQuality, size: number): string {
  return `${thumbnailBoxOf(shownThumbnailSize(quality, size))}px`;
}
