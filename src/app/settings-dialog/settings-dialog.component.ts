import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSetting,
  saveUserSettingsAndRestartApp
} from '../../../src-shared/user-settings/user-settings';
import { SettingsChangedService } from './service/settings-changed.service';

const settingsTabNames = [
  'Appearance',
  'Date & Time',
  'Cache'
] as const;
type SettingsTabName = typeof settingsTabNames[number];

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent {
  public userSettingsToBeSaved = getUserSettingsToBeSaved();
  public tabNames = settingsTabNames;
  public selectedTab: SettingsTabName = settingsTabNames[0];

  constructor(private settingsDialogRef: MatDialogRef<SettingsDialogComponent>,
              private settingsChangedService: SettingsChangedService) {
    this.settingsChangedService.appearanceSettingsChanged.subscribe(changed => {
      this.userSettingsToBeSaved.showStatusBar = changed.showStatusBar;
    });
    this.settingsChangedService.dateTimeSettingsChanged.subscribe(changed => {
      this.userSettingsToBeSaved.dateFormat = changed.dateFormat;
      this.userSettingsToBeSaved.clockSystemFormat = changed.clockSystemFormat;
    });
  }

  public selectTab(tabName: SettingsTabName) {
    this.selectedTab = tabName;
  }

  public isSelectedTab(tabName: SettingsTabName) {
    return this.selectedTab === tabName;
  }

  public get isAppRestartRequired(): boolean {
    const isDateFormatChanged = this.userSettingsToBeSaved.dateFormat !== currentUserSettings.dateFormat;
    const isClockSystemFormatChanged = this.userSettingsToBeSaved.clockSystemFormat !== currentUserSettings.clockSystemFormat;
    const isAppRestartRequired = isDateFormatChanged || isClockSystemFormatChanged;
    return isAppRestartRequired;
  }

  public get isSaveButtonEnabled(): boolean {
    const showStatusBarChanged = this.userSettingsToBeSaved.showStatusBar !== currentUserSettings.showStatusBar;
    const isDateFormatChanged = this.userSettingsToBeSaved.dateFormat !== currentUserSettings.dateFormat;
    const isClockSystemFormatChanged = this.userSettingsToBeSaved.clockSystemFormat !== currentUserSettings.clockSystemFormat;
    const changedFromCurrentUserSettings = showStatusBarChanged || isDateFormatChanged || isClockSystemFormatChanged;
    return changedFromCurrentUserSettings;
  }

  public saveSettings() {
    if (this.isAppRestartRequired) {
      const isOkPressed = window.confirm('This application will restart after saving settings.\nDo you want to continue?');
      if (!isOkPressed)
        return;

      saveUserSettingsAndRestartApp(this.userSettingsToBeSaved);
    } else {
      saveUserSetting(this.userSettingsToBeSaved);
      this.settingsDialogRef.close();
    }
  }

  public handleCancelClicked() {

    this.settingsDialogRef.close();
  }
}
