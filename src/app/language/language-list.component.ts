import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { afterNextRender, Component, ElementRef, inject, model } from '@angular/core';
import { currentLanguage, systemLanguage, t } from '../../../src-shared/i18n/i18n';
import { getLanguage, languages, LanguageSetting, languageSettingAuto } from '../../../src-shared/i18n/languages';
import { currentPlatform } from '../../../src-shared/startup/startup-metadata';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { systemLanguageLabelKey } from './system-language-label';

interface LanguageListItem {
  setting: LanguageSetting;
  label: string;
  /** The language that the label is written in, by which it is drawn and read aloud. */
  labelLanguage: string;
}

/**
 * The list to choose the Language setting from, in the Language dialog and in the Settings dialog: the operating
 * system's language first, by the name of macOS or Windows and with the language that it stands for on this computer,
 * then each language under its own name, so that a user who cannot read the current language still finds theirs.
 * TL;DR: A list in a box that scrolls, like the one in the setup of macOS, so that the dialogs stay as they are when
 * languages are added.
 * Details: Radio buttons, which this was at first, make the dialog taller with every language. A menu would show one
 * language until it is opened, while at the first launch the languages themselves are what the user looks for.
 */
@Component({
  selector: 'app-language-list',
  template: `
    <ul class="languages"
        cdkListbox
        [attr.aria-label]="'language.title' | t"
        [cdkListboxValue]="[selected()]"
        (cdkListboxValueChange)="onChosen($event)">
      @for (item of items; track item.setting) {
        <li class="language" [cdkOption]="item.setting" [attr.lang]="item.labelLanguage">{{ item.label }}</li>
      }
    </ul>
  `,
  styleUrl: './language-list.component.scss',
  imports: [CdkListbox, CdkOption, TranslatePipe]
})
export class LanguageListComponent {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The Language setting that is chosen in the list. */
  public readonly selected = model.required<LanguageSetting>();

  public readonly items: readonly LanguageListItem[] = [
    {
      setting: languageSettingAuto,
      label: t(systemLanguageLabelKey(currentPlatform()), { language: getLanguage(systemLanguage).name }),
      labelLanguage: currentLanguage,
    },
    ...languages.map(language => ({ setting: language.code, label: language.name, labelLanguage: language.code })),
  ];

  constructor() {
    // With more languages than the box shows at once, the chosen one may be below its edge.
    afterNextRender(() => {
      this.host.nativeElement.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  public onChosen(event: ListboxValueChangeEvent<LanguageSetting>) {
    const [setting] = event.value;
    if (setting !== undefined) this.selected.set(setting);
  }
}
