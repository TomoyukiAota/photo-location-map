import { Injectable } from '@angular/core';
import { unitOfTime } from 'moment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DateTimeTakenChartConfigService {
  public readonly showDateUnknownPhotos = new BehaviorSubject<boolean>(true);
  public readonly xAxisUnitMomentJsStr = new BehaviorSubject<unitOfTime.DurationConstructor>('day');
}
