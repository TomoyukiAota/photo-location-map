import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AppearanceSettingsChangedParameter } from '../appearance-settings/appearance-settings-changed-parameter';
import { DateTimeSettingsChangedParameter } from '../date-time-settings/date-time-settings-changed-parameter';

@Injectable({
  providedIn: 'root'
})
export class SettingsDialogService {
  public appearanceSettingsChanged = new Subject<AppearanceSettingsChangedParameter>();
  public dateTimeSettingsChanged = new Subject<DateTimeSettingsChangedParameter>();
}
