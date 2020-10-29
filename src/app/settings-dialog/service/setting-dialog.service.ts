import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DateTimeSettingsChangedParameter } from '../date-time-settings/date-time-settings-changed-parameter';

@Injectable({
  providedIn: 'root'
})
export class SettingDialogService {
  public dateTimeSettingsChanged = new Subject<DateTimeSettingsChangedParameter>();
}
