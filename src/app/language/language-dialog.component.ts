import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { currentLanguage, tIn } from '../../../src-shared/i18n/i18n';
import { LanguageSetting } from '../../../src-shared/i18n/languages';
import { resolveLanguage } from '../../../src-shared/i18n/resolve-language';
import { Logger } from '../../../src-shared/log/logger';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import {
  currentUserSettings,
  getUserSettingsToBeSaved,
  saveUserSetting,
  saveUserSettingsAndRestartApp,
} from '../../../src-shared/user-settings/user-settings';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { LanguageListComponent } from './language-list.component';

/**
 * The dialog in which the user chooses the language, shown before anything else until a language is confirmed in it
 * (LanguageDialogAtAppLaunchService). It is in the language that the application chose from the operating system's
 * languages; its button keeps that one, or restarts the application in the chosen one.
 */
@Component({
  selector: 'app-language-dialog',
  templateUrl: './language-dialog.component.html',
  styleUrl: './language-dialog.component.scss',
  imports: [MatButton, LanguageListComponent, TranslatePipe]
})
export class LanguageDialogComponent {
  private dialogRef = inject<MatDialogRef<LanguageDialogComponent>>(MatDialogRef);

  /** The Language setting chosen in the list: the one in use until the user chooses another. */
  public readonly selected = signal<LanguageSetting>(currentUserSettings.language);

  /** The language that the chosen setting shows the application in. */
  public readonly selectedLanguage = computed(() =>
    resolveLanguage({ languageSetting: this.selected(), systemLanguages: startupMetadata().systemLanguages }));

  /** Whether the button restarts the application: the texts on screen are in another language than the chosen one. */
  public readonly isRestartRequired = computed(() => this.selectedLanguage() !== currentLanguage);

  /** That the application will restart, in the chosen language, which is the one that the user reads. */
  public readonly restartNote = computed(() => tIn(this.selectedLanguage(), 'language.restartToApply'));

  /** The button's text, in the chosen language as well. */
  public readonly confirmLabel = computed(() => tIn(this.selectedLanguage(), 'language.confirm'));

  /**
   * Saves that the user confirmed a language, and the Language setting, before the dialog closes or, for another
   * language than the one on screen, the application restarts.
   */
  public async onOkClicked(): Promise<void> {
    const language = this.selected();
    Logger.info(`[Language Dialog] Clicked OK button with the Language setting "${language}".`);
    Analytics.trackEvent('Language Dialog', '[Language Dialog] Clicked OK button', `Language: ${language}`);

    await UserDataStorage.write(UserDataStoragePath.History.ClickedOkOnLanguageDialog, true.toString());
    const settings = { ...getUserSettingsToBeSaved(), language };
    if (this.isRestartRequired()) {
      await saveUserSettingsAndRestartApp(settings);
    } else {
      await saveUserSetting(settings);
      this.dialogRef.close();
    }
  }
}
