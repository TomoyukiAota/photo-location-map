import { Component } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import * as moment from 'moment-timezone';
import { DateTimeFormat } from '../../../../src-shared/date-time/date-time-format';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { SettingsChangedService } from '../service/settings-changed.service';
import { DateTimeSettingsChangedParameter } from './date-time-settings-changed-parameter';

@Component({
  selector: 'app-date-time-settings',
  templateUrl: './date-time-settings.component.html',
  styleUrls: ['./date-time-settings.component.scss']
})
export class DateTimeSettingsComponent {
  public dateFormatList = DateTimeFormat.ForUser.DateFormat_List;
  public clockSystemFormatList = DateTimeFormat.ForUser.ClockSystemFormat_List;
  public selectedDateFormat = currentUserSettings.dateFormat;
  public selectedClockSystemFormat = currentUserSettings.clockSystemFormat;

  constructor(private settingsChangedService: SettingsChangedService) {
  }

  public getDateTimeNow() {
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsDateTimeFormat(this.selectedDateFormat, this.selectedClockSystemFormat);
    const now = moment('2019-11-25T14:53:29.396Z').utc().format(momentJsFormatString);
    return now;
  }

  public notifySettingsChanged(event: MatSelectChange) {
    const parameter = new DateTimeSettingsChangedParameter();
    parameter.dateFormat = this.selectedDateFormat;
    parameter.clockSystemFormat = this.selectedClockSystemFormat;
    this.settingsChangedService.dateTimeSettingsChanged.next(parameter);
    event.source.close();
  }
}
