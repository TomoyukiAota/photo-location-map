import { ThumbnailQuality } from '../../../../src-shared/user-settings/thumbnail-quality';

export class ThumbnailSettingsChangedParameter {
  thumbnailQuality: ThumbnailQuality;
  /**
   * The longer side of the thumbnails at High quality in the sidebar's folder tree, in pixels
   * (src-shared/user-settings/thumbnail-size.ts).
   */
  sidebarThumbnailSize: number;
  /** The longer side of the thumbnails at High quality in the map's popups, in pixels. */
  mapThumbnailSize: number;
}
