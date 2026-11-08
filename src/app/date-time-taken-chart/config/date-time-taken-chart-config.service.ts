import { signal, Service } from '@angular/core';
import { unitOfTime } from 'moment';

@Service()
export class DateTimeTakenChartConfigService {
  private readonly showDateUnknownPhotosState = signal(true);
  private readonly xAxisUnitState = signal<unitOfTime.DurationConstructor>('day');
  /** Whether the photos without a shooting time are pinned on the map, which the chart menu's checkbox shows. */
  public readonly showDateUnknownPhotos = this.showDateUnknownPhotosState.asReadonly();
  /** The unit of time of the chart's x-axis. */
  public readonly xAxisUnit = this.xAxisUnitState.asReadonly();

  public setShowDateUnknownPhotos(showDateUnknownPhotos: boolean): void {
    this.showDateUnknownPhotosState.set(showDateUnknownPhotos);
  }

  public setXAxisUnit(xAxisUnit: unitOfTime.DurationConstructor): void {
    this.xAxisUnitState.set(xAxisUnit);
  }
}
