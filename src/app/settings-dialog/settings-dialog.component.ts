import { Component } from '@angular/core';
import * as moment from 'moment-timezone';
import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import FormatNameType = DateTimeFormat.ForUser.DateFormatType;
import { loadedUserSettings, saveUserSettings, UserSettings } from '../shared/user-settings';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent {
  public dateFormatList = DateTimeFormat.ForUser.dateFormatList;
  public clockSystemFormatList = DateTimeFormat.ForUser.clockSystemFormatList;
  public selectedDateFormat = loadedUserSettings.dateFormat;
  public selectedClockSystemFormat = loadedUserSettings.clockSystemFormat;

  public getDateTimeNow() {
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(this.selectedDateFormat as FormatNameType, this.selectedClockSystemFormat);
    const now = moment('2019-11-25T14:53:29.396Z').utc().format(momentJsFormatString);
    return now;
  }

  public isSaveButtonEnabled() {
    const isDateFormatChanged = this.selectedDateFormat !== loadedUserSettings.dateFormat;
    const isClockSystemFormatChanged = this.selectedClockSystemFormat !== loadedUserSettings.clockSystemFormat;
    return isDateFormatChanged || isClockSystemFormatChanged;
  }

  public saveSettings() {
    const userSettings = new UserSettings();
    userSettings.dateFormat = this.selectedDateFormat;
    userSettings.clockSystemFormat = this.selectedClockSystemFormat;
    saveUserSettings(userSettings);
  }
}
