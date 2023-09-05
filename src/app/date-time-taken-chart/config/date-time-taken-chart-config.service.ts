import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DateTimeTakenChartConfigService {
  public readonly showDateUnknownPhotos = new BehaviorSubject<boolean>(true);
}
