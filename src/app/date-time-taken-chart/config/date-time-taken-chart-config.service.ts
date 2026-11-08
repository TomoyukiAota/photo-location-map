import { computed, inject, linkedSignal, signal, Service } from '@angular/core';
import { unitOfTime } from 'moment';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';

@Service()
export class DateTimeTakenChartConfigService {
  private readonly selectedPhotoService = inject(SelectedPhotoService);

  private readonly xAxisUnitState = signal<unitOfTime.DurationConstructor>('day');
  /** The unit of time of the chart's x-axis. */
  public readonly xAxisUnit = this.xAxisUnitState.asReadonly();

  /**
   * Changes when the chart draws again, for other selected photos or another unit of the x-axis, which ends its zoom (its
   * option zooms out fully) and shows the photos without a shooting time again. The linked signals below go back to
   * that state as soon as they are read after such a change, so that the pinned photos never mix the new photos or unit
   * with the zoom or checkbox of the old ones.
   */
  public readonly chartRedrawn = computed(() => ({
    selectedPhotos: this.selectedPhotoService.selectedPhotos(),
    xAxisUnit: this.xAxisUnit(),
  }));

  private readonly showDateUnknownPhotosState = linkedSignal({ source: this.chartRedrawn, computation: () => true });
  /** Whether the photos without a shooting time are pinned on the map, which the chart menu's checkbox shows. */
  public readonly showDateUnknownPhotos = this.showDateUnknownPhotosState.asReadonly();

  private readonly xValuesWithinZoomState = linkedSignal({
    source: this.chartRedrawn,
    computation: (): readonly string[] | null => null,
  });
  /** The values of the chart's x-axis within its zoom, or null when the chart is not zoomed. */
  public readonly xValuesWithinZoom = this.xValuesWithinZoomState.asReadonly();

  public setShowDateUnknownPhotos(showDateUnknownPhotos: boolean): void {
    this.showDateUnknownPhotosState.set(showDateUnknownPhotos);
  }

  public setXAxisUnit(xAxisUnit: unitOfTime.DurationConstructor): void {
    this.xAxisUnitState.set(xAxisUnit);
  }

  /** The chart zoomed in on these values of its x-axis: the photos taken within them are pinned, without the others. */
  public zoom(xValuesWithinZoom: readonly string[]): void {
    this.xValuesWithinZoomState.set([...xValuesWithinZoom]);
    this.showDateUnknownPhotosState.set(false);
  }

  /** The chart's zoom was reset: every selected photo is pinned again. */
  public resetZoom(): void {
    this.xValuesWithinZoomState.set(null);
    this.showDateUnknownPhotosState.set(true);
  }
}
