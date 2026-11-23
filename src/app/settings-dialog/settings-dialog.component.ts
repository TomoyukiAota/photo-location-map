import { Component, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { tIn } from '../../../src-shared/i18n/i18n';
import { getLanguage } from '../../../src-shared/i18n/languages';
import { resolveLanguage } from '../../../src-shared/i18n/resolve-language';
import { TranslationKey } from '../../../src-shared/i18n/translation-key';
import { currentPlatform, startupMetadata } from '../../../src-shared/startup/startup-metadata';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSetting,
  saveUserSettingsAndRestartApp,
  UserSettingsToBeSaved
} from '../../../src-shared/user-settings/user-settings';
import { DirTreeViewStickyRowsService } from '../directory-tree-view/dir-tree-view-sticky-rows/dir-tree-view-sticky-rows.service';
import { HeifThumbnailService } from '../heif-thumbnail/heif-thumbnail.service';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { RestoreSettingsService } from './service/restore-settings.service';
import { SettingsChangedService } from './service/settings-changed.service';
import { MatNavList, MatListItem } from '@angular/material/list';
import { AppearanceSettingsComponent } from './appearance-settings/appearance-settings.component';
import { DateTimeSettingsComponent } from './date-time-settings/date-time-settings.component';
import { LanguageSettingsComponent } from './language-settings/language-settings.component';
import { OsSettingsComponent } from './os-settings/os-settings.component';
import { ThumbnailSettingsComponent } from './thumbnail-settings/thumbnail-settings.component';
import { MatButton } from '@angular/material/button';

// The tabs: each with an identifier, which the code knows it by, and the key of its name. Language is first, and so
// the tab that the dialog opens on, for a user who cannot read the current language to find it. The cache of the
// thumbnails is on the Thumbnails tab (ThumbnailSettingsComponent).
const settingsTabs = [
  { id: 'language', labelKey: 'settings.tabs.language' },
  { id: 'appearance', labelKey: 'settings.tabs.appearance' },
  { id: 'dateTime', labelKey: 'settings.tabs.dateTime' },
  { id: 'thumbnails', labelKey: 'settings.tabs.thumbnails' },
  { id: 'os', labelKey: 'settings.tabs.os' },
] as const satisfies ReadonlyArray<{ id: string, labelKey: TranslationKey }>;
type SettingsTab = typeof settingsTabs[number];
export type SettingsTabId = SettingsTab['id'];

/** What opens the dialog may choose the tab that it opens on, as the status bar of thumbnails does (SettingsDialogService). */
export interface SettingsDialogData {
  readonly initialTab?: SettingsTabId;
}

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
    ThumbnailSettingsComponent, MatButton, TranslatePipe,
  ]
})
export class SettingsDialogComponent {
  private settingsDialogRef = inject<MatDialogRef<SettingsDialogComponent>>(MatDialogRef);
  private restoreSettingsService = inject(RestoreSettingsService);
  private confirmDialogService = inject(ConfirmDialogService);
  private heifThumbnailService = inject(HeifThumbnailService);
  private stickyRowsService = inject(DirTreeViewStickyRowsService);
  private data = inject<SettingsDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  public readonly tabs = availableSettingsTabs;
  public readonly selectedTab = signal<SettingsTabId>(
    availableSettingsTabs.find(tab => tab.id === this.data?.initialTab)?.id ?? availableSettingsTabs[0].id);
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
    const thumbnailQualityChanged = settings.thumbnailQuality !== currentUserSettings.thumbnailQuality;
    const stickyFolderRowsChanged = settings.stickyFolderRowsMaximum !== currentUserSettings.stickyFolderRowsMaximum
      || settings.stickyFolderRowsLeftOut !== currentUserSettings.stickyFolderRowsLeftOut;
    return showStatusBarChanged || thumbnailQualityChanged || stickyFolderRowsChanged || this.isAppRestartRequired();
  });

  /**
   * The language that the Language setting chosen in the dialog shows the application in, which is the application's
   * own until another is chosen. The restart note, Save, Cancel and the question that Save asks are in it.
   * TL;DR: A user who chooses a language reads it, so the dialog tells them in it what saving does.
   * Details: The application changes its language only once it restarts, and a user who chose another language may
   * not read the one on screen. The Language dialog of the first launch does the same with its note and its button
   * (LanguageDialogComponent). The texts take that language's lang and dir, while the dialog keeps the application's
   * layout.
   */
  public readonly selectedLanguage = computed(() => resolveLanguage({
    languageSetting: this.userSettingsToBeSaved().language,
    systemLanguages: startupMetadata().systemLanguages,
  }));
  public readonly selectedDirection = computed(() => getLanguage(this.selectedLanguage()).direction);
  public readonly restartNote = computed(() => tIn(this.selectedLanguage(), 'settings.restartAfterSaving'));
  public readonly saveLabel = computed(() => tIn(this.selectedLanguage(), 'settings.save'));
  public readonly cancelLabel = computed(() => tIn(this.selectedLanguage(), 'common.cancel'));

  constructor() {
    const settingsChangedService = inject(SettingsChangedService);

    // The service outlives the dialog, so each dialog stops listening when it closes.
    settingsChangedService.appearanceSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({
        ...settings,
        showStatusBar: changed.showStatusBar,
        stickyFolderRowsMaximum: changed.stickyFolderRowsMaximum,
        stickyFolderRowsLeftOut: changed.stickyFolderRowsLeftOut,
      }));
    });
    settingsChangedService.languageSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({ ...settings, language: changed.language }));
    });
    settingsChangedService.thumbnailSettingsChanged.pipe(takeUntilDestroyed()).subscribe(changed => {
      this.userSettingsToBeSaved.update(settings => ({ ...settings, thumbnailQuality: changed.thumbnailQuality }));
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
      const language = this.selectedLanguage();
      const isOkPressed = await this.confirmDialogService.confirmIn(language, tIn(language, 'settings.confirmRestart'));
      if (!isOkPressed)
        return;

      saveUserSettingsAndRestartApp(this.userSettingsToBeSaved());
    } else {
      const isThumbnailQualityChanged = this.userSettingsToBeSaved().thumbnailQuality !== currentUserSettings.thumbnailQuality;
      saveUserSetting(this.userSettingsToBeSaved());
      // Applies at once: the thumbnails of the opened folder are made again.
      if (isThumbnailQualityChanged)
        void this.heifThumbnailService.applyThumbnailQuality();
      // Applies at once: the rows kept at the top of the folder tree, which saving has just set in currentUserSettings.
      this.stickyRowsService.applySettings();
      this.settingsDialogRef.close();
    }
  }

  public handleCancelClicked() {
    this.restoreSettingsService.restore();
    this.settingsDialogRef.close();
  }
}
