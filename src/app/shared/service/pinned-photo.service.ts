import { computed, inject, Service } from '@angular/core';
import isEqual from 'lodash-es/isEqual.js';
import { DateTimeTakenChartConfigService } from '../../date-time-taken-chart/config/date-time-taken-chart-config.service';
import { photosToPin } from '../../date-time-taken-chart/photos-to-pin';
import { Photo } from '../model/photo.model';
import { SelectedPhotoService } from './selected-photo.service';

/** Whether the photos are the same, whatever their order. */
function haveSamePaths(a: readonly Photo[], b: readonly Photo[]): boolean {
  return isEqual(a.map(photo => photo.path).sort(), b.map(photo => photo.path).sort());
}

@Service()
export class PinnedPhotoService {
  private readonly selectedPhotoService = inject(SelectedPhotoService);
  private readonly chartConfigService = inject(DateTimeTakenChartConfigService);

  /**
   * The photos pinned on the map: the selected photos that the chart's zoom and its menu's checkbox let through
   * (photosToPin). While the same photos are pinned, in any order, it keeps the photos that it has, so that the maps,
   * which render again whenever it changes, are not reset and do not use their quota again.
   */
  public readonly pinnedPhotos = computed<readonly Photo[]>(() => photosToPin(this.selectedPhotoService.selectedPhotos(), {
    xValuesWithinZoom: this.chartConfigService.xValuesWithinZoom(),
    xAxisUnit: this.chartConfigService.xAxisUnit(),
    showDateUnknownPhotos: this.chartConfigService.showDateUnknownPhotos(),
  }), { equal: haveSamePaths });

  public getPinnedPhotos(): Photo[] {
    return Array.from(this.pinnedPhotos());
  }
}
