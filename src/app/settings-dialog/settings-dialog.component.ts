import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import * as os from 'os';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSetting,
  saveUserSettingsAndRestartApp
} from '../../../src-shared/user-settings/user-settings';
import { RestoreSettingsService } from './service/restore-settings.service';
import { SettingsChangedService } from './service/settings-changed.service';

const settingsTabNames = [
  'Appearance',
  'Date & Time',
  'OS',
  'Cache'
] as const;
type SettingsTabName = typeof settingsTabNames[number];

// Show OS tab only on Windows
const availableSettingTabNames = os.platform() === 'win32'
  ? settingsTabNames
  : settingsTabNames.filter(tabName => tabName !== 'OS');

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent {
  public userSettingsToBeSaved = getUserSettingsToBeSaved();
  public tabNames = availableSettingTabNames;
  public selectedTab: SettingsTabName = availableSettingTabNames[0];

  constructor(private settingsDialogRef: MatDialogRef<SettingsDialogComponent>,
              private settingsChangedService: SettingsChangedService,
              private restoreSettingsService: RestoreSettingsService) {
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
    this.restoreSettingsService.restore();
    this.settingsDialogRef.close();
  }
}
