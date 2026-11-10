import { Component, inject, signal } from '@angular/core';
import { LanguageSetting } from '../../../../src-shared/i18n/languages';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { LanguageListComponent } from '../../language/language-list.component';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { SettingsChangedService } from '../service/settings-changed.service';
import { LanguageSettingsChangedParameter } from './language-settings-changed-parameter';

@Component({
  selector: 'app-language-settings',
  templateUrl: './language-settings.component.html',
  styleUrl: './language-settings.component.scss',
  imports: [LanguageListComponent, TranslatePipe]
})
export class LanguageSettingsComponent {
  private settingsChangedService = inject(SettingsChangedService);

  public readonly selectedLanguage = signal<LanguageSetting>(currentUserSettings.language);

  /** Tells the Settings dialog the language chosen in the list, which Save saves, restarting the application. */
  public onLanguageSelected(language: LanguageSetting) {
    this.selectedLanguage.set(language);
    const parameter = new LanguageSettingsChangedParameter();
    parameter.language = language;
    this.settingsChangedService.languageSettingsChanged.next(parameter);
  }
}
