import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import * as os from 'os';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSetting,
  saveUserSettingsAndRestartApp,
  UserSettingsToBeSaved
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
  styleUrls: ['./settings-dialog.component.scss'],
  standalone: false
})
export class SettingsDialogComponent {
  public readonly tabNames = availableSettingTabNames;
  public readonly selectedTab = signal<SettingsTabName>(availableSettingTabNames[0]);
  /** The settings as the tabs have changed them, which Save saves. Each change makes a new object. */
  private readonly userSettingsToBeSaved = signal<UserSettingsToBeSaved>(getUserSettingsToBeSaved());

  /** Whether saving restarts the app: a new date or clock format takes effect only then. */
  public readonly isAppRestartRequired = computed(() => {
    const settings = this.userSettingsToBeSaved();
    const isDateFormatChanged = settings.dateFormat !== currentUserSettings.dateFormat;
    const isClockSystemFormatChanged = settings.clockSystemFormat !== currentUserSettings.clockSystemFormat;
    return isDateFormatChanged || isClockSystemFormatChanged;
  });

  /** Whether any setting differs from the one in use. */
  public readonly isSaveButtonEnabled = computed(() => {
    const settings = this.userSettingsToBeSaved();
    const showStatusBarChanged = settings.showStatusBar !== currentUserSettings.showStatusBar;
    const isDateFormatChanged = settings.dateFormat !== currentUserSettings.dateFormat;
    const isClockSystemFormatChanged = settings.clockSystemFormat !== currentUserSettings.clockSystemFormat;
    return showStatusBarChanged || isDateFormatChanged || isClockSystemFormatChanged;
  });

  constructor(private settingsDialogRef: MatDialogRef<SettingsDialogComponent>,
              settingsChangedService: SettingsChangedService,
              private restoreSettingsService: RestoreSettingsService) {
    // The service outlives the dialog, so each dialog stops listening when it closes.
    settingsChangedService.appearanceSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({ ...settings, showStatusBar: changed.showStatusBar }));
    });
    settingsChangedService.dateTimeSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({
        ...settings,
        dateFormat: changed.dateFormat,
        clockSystemFormat: changed.clockSystemFormat
      }));
    });
  }

  public selectTab(tabName: SettingsTabName) {
    this.selectedTab.set(tabName);
  }

  public isSelectedTab(tabName: SettingsTabName) {
    return this.selectedTab() === tabName;
  }

  /** Saves the settings and closes, after asking first when a new date or clock format needs a restart. */
  public saveSettings() {
    if (this.isAppRestartRequired()) {
      const isOkPressed = window.confirm('This application will restart after saving settings.\nDo you want to continue?');
      if (!isOkPressed)
        return;

      saveUserSettingsAndRestartApp(this.userSettingsToBeSaved());
    } else {
      saveUserSetting(this.userSettingsToBeSaved());
      this.settingsDialogRef.close();
    }
  }

  public handleCancelClicked() {
    this.restoreSettingsService.restore();
    this.settingsDialogRef.close();
  }
}
