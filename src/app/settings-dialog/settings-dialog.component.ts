import { Component } from '@angular/core';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSettingsAndRestartApp
} from '../../../src-shared/user-settings/user-settings';
import { SettingDialogService } from './service/setting-dialog.service';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent {
  public userSettingsToBeSaved = getUserSettingsToBeSaved();

  constructor(private settingsDialogService: SettingDialogService) {
    this.settingsDialogService.dateTimeSettingsChanged.subscribe(changed => {
      this.userSettingsToBeSaved.dateFormat = changed.dateFormat;
      this.userSettingsToBeSaved.clockSystemFormat = changed.clockSystemFormat;
    });
  }

  public get isSaveButtonEnabled(): boolean {
    const isDateFormatChanged = this.userSettingsToBeSaved.dateFormat !== currentUserSettings.dateFormat;
    const isClockSystemFormatChanged = this.userSettingsToBeSaved.clockSystemFormat !== currentUserSettings.clockSystemFormat;
    const isUserSettingsChanged = isDateFormatChanged || isClockSystemFormatChanged;
    return isUserSettingsChanged;
  }

  public saveSettings() {
    const isOkPressed = window.confirm('This application will restart after saving settings.\nDo you want to continue?');
    if (!isOkPressed)
      return;

    saveUserSettingsAndRestartApp(this.userSettingsToBeSaved);
  }
}
