import { unitOfTime } from 'moment';
import { Photo } from '../shared/model/photo.model';
import { momentToStringMap } from '../shared/moment-to-string-map';

/** What decides, besides the selection, the photos pinned on the map: the chart's zoom and its menu's checkbox. */
export interface PinnedPhotosFilter {
  /** The values of the chart's x-axis within its zoom, or null when the chart is not zoomed. */
  readonly xValuesWithinZoom: readonly string[] | null;
  /** The unit of the chart's x-axis, which those values are in. */
  readonly xAxisUnit: unitOfTime.DurationConstructor;
  /** Whether the photos without a shooting time are pinned too, as the checkbox of the chart's menu says. */
  readonly showDateUnknownPhotos: boolean;
}

/**
 * The selected photos to pin on the map, in the order of the selection: those with a shooting time within the chart's
 * zoom, or all of them when the chart is not zoomed, and those without a shooting time when the checkbox asks for them.
 */
export function photosToPin(selectedPhotos: readonly Photo[], filter: PinnedPhotosFilter): Photo[] {
  const momentToString = momentToStringMap.get(filter.xAxisUnit);
  const xValuesWithinZoom = filter.xValuesWithinZoom == null ? null : new Set(filter.xValuesWithinZoom);
  return selectedPhotos.filter(photo => {
    const dateTimeOriginal = photo.exif?.dateTimeOriginal;
    if (!dateTimeOriginal) return filter.showDateUnknownPhotos;
    return xValuesWithinZoom == null || xValuesWithinZoom.has(momentToString(dateTimeOriginal.moment));
  });
}
