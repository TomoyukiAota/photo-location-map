import { Component } from '@angular/core';
import * as moment from 'moment-timezone';
import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { Logger } from '../../../src-shared/log/logger';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { loadedUserSettings, saveUserSettings, UserSettings } from '../../../src-shared/user-settings/user-settings';

const electron = ProxyRequire.electron;

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent {
  public dateFormatList = DateTimeFormat.ForUser.DateFormat_List;
  public clockSystemFormatList = DateTimeFormat.ForUser.ClockSystemFormat_List;
  public selectedDateFormat = loadedUserSettings.dateFormat;
  public selectedClockSystemFormat = loadedUserSettings.clockSystemFormat;

  public getDateTimeNow() {
    const momentJsFormatString = DateTimeFormat.ForUser.getMomentJsFormatString(this.selectedDateFormat, this.selectedClockSystemFormat);
    const now = moment('2019-11-25T14:53:29.396Z').utc().format(momentJsFormatString);
    return now;
  }

  public isSaveButtonEnabled() {
    const isDateFormatChanged = this.selectedDateFormat !== loadedUserSettings.dateFormat;
    const isClockSystemFormatChanged = this.selectedClockSystemFormat !== loadedUserSettings.clockSystemFormat;
    return isDateFormatChanged || isClockSystemFormatChanged;
  }

  public saveSettings() {
    const isOkPressed = window.confirm('This application will restart after saving settings.\nDo you want to continue?');
    if (!isOkPressed)
      return;

    const userSettings = new UserSettings(this.selectedDateFormat, this.selectedClockSystemFormat);
    saveUserSettings(userSettings);
    Logger.info(`User settings are saved, so the application will restart.`);
    electron.remote.app.relaunch();
    electron.remote.app.exit(0);
  }
}
