import { Injectable } from '@angular/core';
import { unitOfTime } from 'moment';
import { BehaviorSubject } from 'rxjs';
import { getXAxisUnitMomentJsStr } from './date-time-taken-chart-x-axis-unit';

@Injectable({
  providedIn: 'root'
})
export class DateTimeTakenChartConfigService {
  public readonly showDateUnknownPhotos = new BehaviorSubject<boolean>(true);
  public readonly xAxisUnitMomentJsStr = new BehaviorSubject<unitOfTime.DurationConstructor>('day');
  public setXAxisUnitDisplayStr(xAxisUnitDisplayStr: string)
  {
    const momentJsStr = getXAxisUnitMomentJsStr(xAxisUnitDisplayStr);
    this.xAxisUnitMomentJsStr.next(momentJsStr);
  }
}
