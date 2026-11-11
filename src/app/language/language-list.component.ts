import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { afterNextRender, ChangeDetectorRef, Component, computed, ElementRef, inject, Injector, model, signal, viewChild } from '@angular/core';
import { currentLanguage, systemLanguage, t } from '../../../src-shared/i18n/i18n';
import { getLanguage, languages, LanguageSetting, languageSettingAuto } from '../../../src-shared/i18n/languages';
import { currentPlatform } from '../../../src-shared/startup/startup-metadata';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { LanguageListItem, matchesSearch } from './language-search';
import { systemLanguageLabelKey } from './system-language-label';

/** The number of the next list, by which its search field names it. */
let nextListNumber = 0;

/** Scrolls the list, and nothing around it, by as little as shows the entry. */
function showInList(list: HTMLElement, entry: HTMLElement): void {
  const top = entry.offsetTop;
  const bottom = top + entry.offsetHeight;
  if (top < list.scrollTop)
    list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight)
    list.scrollTop = bottom - list.clientHeight;
}

/** The names of languages in the language that the application is shown in: ドイツ語 for German in Japanese. */
const namesInApplicationLanguage = new Intl.DisplayNames([currentLanguage], { type: 'language' });

/**
 * The list to choose the Language setting from, in the Language dialog and in the Settings dialog, with a field above
 * it that narrows the list down: the operating system's language first, by the name of macOS or Windows and with the
 * language that it stands for on this computer, then each language under its own name, so that a user who cannot read
 * the current language still finds theirs. Each entry has the flag of its language beside it, the operating system's
 * that of the language that it stands for.
 * TL;DR: A list in a box that scrolls, like the one in the setup of macOS, so that the dialogs stay as they are when
 * languages are added. Photo Data Viewer's list looks and works like this one.
 * Details: Radio buttons, which this was at first, make the dialog taller with every language. A menu would show one
 * language until it is opened, while at the first launch the languages themselves are what the user looks for. The
 * search is without regard to case or diacritics, and finds a language by its own name, its English name, its name in
 * the application's language or its code. The chosen entry stays chosen while the search hides it.
 */
@Component({
  selector: 'app-language-list',
  template: `
    <input class="search"
           type="search"
           autocomplete="off"
           autocapitalize="off"
           spellcheck="false"
           [placeholder]="'language.search' | t"
           [attr.aria-label]="'language.search' | t"
           [attr.aria-controls]="listId"
           [value]="search()"
           (input)="onSearchInput($event)">
    <div class="box">
      <ul #list
          class="languages"
          cdkListbox
          [id]="listId"
          [hidden]="listedItems().length === 0"
          [attr.aria-label]="'language.title' | t"
          [cdkListboxValue]="[selected()]"
          (cdkListboxValueChange)="onChosen($event)">
        @for (item of listedItems(); track item.setting) {
          <!-- The name is on its own, so that one written in the other direction than the page keeps its order. The
               flag is before it, at the side where the page's lines start, and is not read aloud. -->
          <li class="language" [cdkOption]="item.setting" [attr.data-setting]="item.setting" [attr.lang]="item.labelLanguage"
            ><span class="flag fi fi-{{ item.flag }}" aria-hidden="true"></span><bdi>{{ item.label }}</bdi></li>
        }
      </ul>
      <div class="no-languages" role="status">{{ listedItems().length === 0 ? ('language.noLanguagesFound' | t) : '' }}</div>
    </div>
  `,
  styleUrl: './language-list.component.scss',
  imports: [CdkListbox, CdkOption, TranslatePipe]
})
export class LanguageListComponent {
  private injector = inject(Injector);
  private changeDetector = inject(ChangeDetectorRef);
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  /** The Language setting that is chosen in the list. */
  public readonly selected = model.required<LanguageSetting>();

  /** What is typed in the search field. */
  public readonly search = signal('');

  public readonly listId = `language-list-${nextListNumber++}`;

  public readonly items: readonly LanguageListItem[] = [
    {
      setting: languageSettingAuto,
      label: t(systemLanguageLabelKey(currentPlatform()), { language: getLanguage(systemLanguage).name }),
      labelLanguage: currentLanguage,
      flag: getLanguage(systemLanguage).flag,
      keywords: [],
    },
    ...languages.map(language => ({
      setting: language.code,
      label: language.name,
      labelLanguage: language.code,
      flag: language.flag,
      keywords: [language.englishName, namesInApplicationLanguage.of(language.code) ?? '', language.code],
    })),
  ];

  /** The entries that the search leaves: all of them while nothing is typed. */
  public readonly listedItems = computed(() => this.items.filter(item => matchesSearch(item, this.search())));

  constructor() {
    afterNextRender(() => this.showChosenEntry());
  }

  public onSearchInput(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
    afterNextRender(() => {
      this.showChosenEntry();
      // TL;DR: The entries are checked once more, so that the chosen one is drawn as chosen when the search lists it
      // again.
      // Details: While the search hides the chosen entry, the list box of the CDK has a value that none of its
      // options has, and draws no option as chosen. It learns of the options that are back only after they are drawn,
      // in the same pass, so the chosen one would stay drawn as not chosen until a later pass, which nothing else asks
      // for.
      this.changeDetector.markForCheck();
    }, { injector: this.injector });
  }

  public onChosen(event: ListboxValueChangeEvent<LanguageSetting>) {
    const [setting] = event.value;
    if (setting !== undefined) this.selected.set(setting);
  }

  /**
   * With more languages than the box shows at once, the chosen one may be outside it: it is shown when the list
   * appears and when the search is cleared. While the user types, the list starts at its first match.
   */
  private showChosenEntry() {
    const list = this.list().nativeElement;
    const chosen = Array.from(list.querySelectorAll<HTMLElement>('[data-setting]')).find(entry => entry.dataset.setting === this.selected());
    if (this.search().trim() === '' && chosen)
      showInList(list, chosen);
    else
      list.scrollTop = 0;
  }
}
