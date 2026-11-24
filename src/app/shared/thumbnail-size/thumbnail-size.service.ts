import { computed, Service, signal } from '@angular/core';
import { ThumbnailQuality } from '../../../../src-shared/user-settings/thumbnail-quality';
import { madeThumbnailLongerSide, thumbnailBoxOf } from '../../../../src-shared/user-settings/thumbnail-size';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

/**
 * The quality and the size of the thumbnails as the settings have them, for what the page shows and makes: signals, as
 * the settings are not one, so that the views follow a new setting once it is saved (follow()).
 * TL;DR: The size is the longer side of the thumbnails that the app makes, at High quality the one that the slider of
 * the Thumbnails tab chooses, and the folder tree and the map's popups show a thumbnail in a box of half that, in CSS
 * pixels (src-shared/user-settings/thumbnail-size.ts).
 * Details: The box is a CSS custom property that the application's root element has (AppComponent), which every
 * photo's viewer reads in its styles: nothing of the size is bound in each viewer, of which there is one for every
 * photo of the tree (PhotoInfoViewerComponent).
 */
@Service()
export class ThumbnailSizeService {
  private readonly settings = signal(settingsNow());

  public readonly quality = computed<ThumbnailQuality>(() => this.settings().quality);
  /** The longer side of the thumbnails that the app makes from the photos, in pixels. */
  public readonly longerSide = computed(() => madeThumbnailLongerSide(this.settings().quality, this.settings().size));
  /** The box of a thumbnail in the folder tree and the map's popups, as CSS takes it. */
  public readonly box = computed(() => `${thumbnailBoxOf(this.longerSide())}px`);

  /** Follows the settings as they were saved. Returns whether the quality or the size changed. */
  public follow(): boolean {
    const now = settingsNow();
    const previous = this.settings();
    if (now.quality === previous.quality && now.size === previous.size)
      return false;
    this.settings.set(now);
    return true;
  }
}

function settingsNow() {
  return { quality: currentUserSettings.thumbnailQuality, size: currentUserSettings.thumbnailSize };
}
