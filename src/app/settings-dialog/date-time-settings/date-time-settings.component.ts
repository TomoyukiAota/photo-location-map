import { Component } from '@angular/core';
import * as moment from 'moment-timezone';
import { DateTimeFormat } from '../../../../src-shared/date-time/date-time-format';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { SettingsDialogService } from '../service/settings-dialog.service';
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

  constructor(private settingsDialogService: SettingsDialogService) {
  }

  public getDateTimeNow() {
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(this.selectedDateFormat, this.selectedClockSystemFormat);
    const now = moment('2019-11-25T14:53:29.396Z').utc().format(momentJsFormatString);
    return now;
  }

  public notifySettingsChanged() {
    const parameter = new DateTimeSettingsChangedParameter();
    parameter.dateFormat = this.selectedDateFormat;
    parameter.clockSystemFormat = this.selectedClockSystemFormat;
    this.settingsDialogService.dateTimeSettingsChanged.next(parameter);
  }
}
