import { Component } from '@angular/core';
import * as moment from 'moment-timezone';
import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import FormatNameType = DateTimeFormat.ForUser.DateFormatType;

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent {
  public dateFormatList = DateTimeFormat.ForUser.dateFormatList;
  public clockSystemFormatList = DateTimeFormat.ForUser.clockSystemFormatList;
  public selectedDateFormat = DateTimeFormat.ForUser.Date_ISO8601Like;
  public selectedClockSystemFormat = DateTimeFormat.ForUser.ClockSystem_24h;

  public getDateTimeNow() {
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(this.selectedDateFormat as FormatNameType, this.selectedClockSystemFormat);
    const now = moment('2019-11-25T14:53:29.396Z').utc().format(momentJsFormatString);
    return now;
  }
}
