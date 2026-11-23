import { ThumbnailQuality } from '../../../../src-shared/user-settings/thumbnail-quality';

export class ThumbnailSettingsChangedParameter {
  thumbnailQuality: ThumbnailQuality;
  /** The longer side of the thumbnails at High quality, in pixels (src-shared/user-settings/thumbnail-size.ts). */
  thumbnailSize: number;
}
