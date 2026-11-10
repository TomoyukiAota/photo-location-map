import { Component, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import { t } from '../../../src-shared/i18n/i18n';
import { TranslationKey } from '../../../src-shared/i18n/translation-key';
import { currentPlatform } from '../../../src-shared/startup/startup-metadata';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSetting,
  saveUserSettingsAndRestartApp,
  UserSettingsToBeSaved
} from '../../../src-shared/user-settings/user-settings';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { RestoreSettingsService } from './service/restore-settings.service';
import { SettingsChangedService } from './service/settings-changed.service';
import { MatNavList, MatListItem } from '@angular/material/list';
import { AppearanceSettingsComponent } from './appearance-settings/appearance-settings.component';
import { DateTimeSettingsComponent } from './date-time-settings/date-time-settings.component';
import { LanguageSettingsComponent } from './language-settings/language-settings.component';
import { OsSettingsComponent } from './os-settings/os-settings.component';
import { CacheSettingsComponent } from './cache-settings/cache-settings.component';
import { MatButton } from '@angular/material/button';

// The tabs: each with an identifier, which the code knows it by, and the key of its name. Language is first, and so
// the tab that the dialog opens on, for a user who cannot read the current language to find it.
const settingsTabs = [
  { id: 'language', labelKey: 'settings.tabs.language' },
  { id: 'appearance', labelKey: 'settings.tabs.appearance' },
  { id: 'dateTime', labelKey: 'settings.tabs.dateTime' },
  { id: 'os', labelKey: 'settings.tabs.os' },
  { id: 'cache', labelKey: 'settings.tabs.cache' },
] as const satisfies ReadonlyArray<{ id: string, labelKey: TranslationKey }>;
type SettingsTab = typeof settingsTabs[number];
type SettingsTabId = SettingsTab['id'];

// Show OS tab only on Windows
const availableSettingsTabs: ReadonlyArray<SettingsTab> = currentPlatform() === 'win32'
  ? settingsTabs
  : settingsTabs.filter(tab => tab.id !== 'os');

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss'],
  imports: [
    MatNavList, MatListItem, LanguageSettingsComponent, AppearanceSettingsComponent, DateTimeSettingsComponent, OsSettingsComponent,
    CacheSettingsComponent, MatButton, TranslatePipe,
  ]
})
export class SettingsDialogComponent {
  private settingsDialogRef = inject<MatDialogRef<SettingsDialogComponent>>(MatDialogRef);
  private restoreSettingsService = inject(RestoreSettingsService);
  private confirmDialogService = inject(ConfirmDialogService);

  public readonly tabs = availableSettingsTabs;
  public readonly selectedTab = signal<SettingsTabId>(availableSettingsTabs[0].id);
  /** The settings as the tabs have changed them, which Save saves. Each change makes a new object. */
  private readonly userSettingsToBeSaved = signal<UserSettingsToBeSaved>(getUserSettingsToBeSaved());

  /** Whether saving restarts the app: a new language, date format or clock format takes effect only then. */
  public readonly isAppRestartRequired = computed(() => {
    const settings = this.userSettingsToBeSaved();
    const isLanguageChanged = settings.language !== currentUserSettings.language;
    const isDateFormatChanged = settings.dateFormat !== currentUserSettings.dateFormat;
    const isClockSystemFormatChanged = settings.clockSystemFormat !== currentUserSettings.clockSystemFormat;
    return isLanguageChanged || isDateFormatChanged || isClockSystemFormatChanged;
  });

  /** Whether any setting differs from the one in use. */
  public readonly isSaveButtonEnabled = computed(() => {
    const settings = this.userSettingsToBeSaved();
    const showStatusBarChanged = settings.showStatusBar !== currentUserSettings.showStatusBar;
    return showStatusBarChanged || this.isAppRestartRequired();
  });

  constructor() {
    const settingsChangedService = inject(SettingsChangedService);

    // The service outlives the dialog, so each dialog stops listening when it closes.
    settingsChangedService.appearanceSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({ ...settings, showStatusBar: changed.showStatusBar }));
    });
    settingsChangedService.languageSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({ ...settings, language: changed.language }));
    });
    settingsChangedService.dateTimeSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({
        ...settings,
        dateFormat: changed.dateFormat,
        clockSystemFormat: changed.clockSystemFormat
      }));
    });
  }

  public selectTab(tabId: SettingsTabId) {
    this.selectedTab.set(tabId);
  }

  public isSelectedTab(tabId: SettingsTabId) {
    return this.selectedTab() === tabId;
  }

  /** Saves the settings and closes, after asking first when a setting that needs a restart has changed. */
  public async saveSettings() {
    if (this.isAppRestartRequired()) {
      const isOkPressed = await this.confirmDialogService.confirm(t('settings.confirmRestart'));
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
