import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconDataUrl } from '../../assets/icon-data-url';
import { languages, LanguageSetting } from '../../../src-shared/i18n/languages';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata';
import { LanguageListComponent } from './language-list.component';

// The tests run in English, the operating system's language of the bridge's stand-in. A case can give the operating
// system other languages, which the first entry is written in, while the application stays in English.
describe('LanguageListComponent', () => {
  const platformInUse = startupMetadata().platform;
  const systemLanguagesInUse = startupMetadata().systemLanguages;
  const systemLanguageEntry = 'Use system setting (English)';
  let fixture: ComponentFixture<LanguageListComponent>;

  afterEach(() => {
    startupMetadata().platform = platformInUse;
    startupMetadata().systemLanguages = systemLanguagesInUse;
  });

  function host(): HTMLElement {
    return fixture.nativeElement;
  }

  function listbox(): HTMLElement {
    return host().querySelector('[role="listbox"]');
  }

  function searchField(): HTMLInputElement {
    return host().querySelector('input[type="search"]');
  }

  /** The entries of the list, with the text, the language and the direction of their names. */
  function items() {
    return Array.from(listbox().querySelectorAll<HTMLElement>('[role="option"]')).map(element => ({
      label: element.textContent.trim(),
      labelLanguage: element.getAttribute('lang'),
      labelDirection: element.querySelector('bdi').getAttribute('dir'),
      selected: element.getAttribute('aria-selected') === 'true',
      element,
    }));
  }

  function labels(): string[] {
    return items().map(item => item.label);
  }

  function chosenLabels(): string[] {
    return items().filter(item => item.selected).map(item => item.label);
  }

  /**
   * Creates the list on `platform`, which the entry of the operating system's language is named after, with
   * `systemLanguages`, the operating system's languages, which that entry is written in.
   */
  async function create(selected: LanguageSetting, platform = 'linux', systemLanguages = ['en-US']) {
    startupMetadata().platform = platform;
    startupMetadata().systemLanguages = systemLanguages;
    await TestBed.configureTestingModule({ imports: [LanguageListComponent] }).compileComponents();
    fixture = TestBed.createComponent(LanguageListComponent);
    fixture.componentRef.setInput('selected', selected);
    await fixture.whenStable();
  }

  /** Types into the search field, in place of what it holds. */
  async function search(text: string) {
    searchField().value = text;
    searchField().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function click(label: string) {
    items().find(item => item.label === label).element.click();
    await fixture.whenStable();
  }

  it('lists the operating system\'s language first, with the language it stands for, then each language under its own name', async () => {
    await create('auto');
    expect(labels()).toEqual([systemLanguageEntry, ...languages.map(language => language.name)]);
    expect(items().map(item => item.labelLanguage)).toEqual(['en', ...languages.map(language => language.code)]);
    // Each in the direction of its language: Arabic and Hebrew from right to left.
    expect(items().map(item => item.labelDirection)).toEqual(['ltr', ...languages.map(language => language.direction)]);
  });

  it.each([
    ['darwin', 'Use macOS setting (English)'],
    ['win32', 'Use Windows setting (English)'],
    ['linux', 'Use system setting (English)'],
  ])('on %s, names the operating system\'s language "%s"', async (platform, label) => {
    await create('auto', platform);
    expect(labels()[0]).toBe(label);
  });

  // The application is in English in these, and the operating system in another language.
  it.each([
    ['ja-JP', 'darwin', 'macOS の設定に従う（日本語）', 'ja', 'ltr'],
    // The name of the language is a value of the text: between U+2068 and U+2069 in a language written from right to left.
    ['ar-SA', 'win32', 'استخدام إعداد Windows (\u2068العربية\u2069)', 'ar', 'rtl'],
    // A language that the application does not have: the entry stands for English, and is written in it.
    ['is-IS', 'darwin', 'Use macOS setting (English)', 'en', 'ltr'],
  ])('on a computer in %s, writes the operating system\'s entry in the language that it stands for, whatever the application\'s language is', async (
    systemLanguage, platform, label, labelLanguage, labelDirection) => {
    await create('auto', platform, [systemLanguage]);
    expect(items()[0]).toMatchObject({ label, labelLanguage, labelDirection, selected: true });
    expect(labels().slice(1)).toEqual(languages.map(language => language.name));
  });

  it('is a list box of which one entry is chosen', async () => {
    await create('auto');
    expect(listbox().getAttribute('aria-label')).toBe('Language');
    expect(listbox().getAttribute('aria-multiselectable')).toBe('false');
    expect(chosenLabels()).toEqual([systemLanguageEntry]);
  });

  it('shows the Language setting that it is given as the chosen one', async () => {
    await create('ja');
    expect(chosenLabels()).toEqual(['日本語']);
  });

  it('tells which Language setting the user chose', async () => {
    await create('auto');
    const chosen: LanguageSetting[] = [];
    fixture.componentInstance.selected.subscribe(setting => chosen.push(setting));

    await click('日本語');

    expect(chosen).toEqual(['ja']);
    expect(fixture.componentInstance.selected()).toBe('ja');
    expect(chosenLabels()).toEqual(['日本語']);
  });

  it('keeps an entry chosen when the user clicks it again, as one is always chosen', async () => {
    await create('auto');
    const chosen: LanguageSetting[] = [];
    fixture.componentInstance.selected.subscribe(setting => chosen.push(setting));

    await click(systemLanguageEntry);

    expect(chosen).toEqual([]);
    expect(chosenLabels()).toEqual([systemLanguageEntry]);
  });

  describe('The search field', () => {
    it('has a magnifying glass after it, which is not read aloud', async () => {
      await create('auto');
      const icon = host().querySelector<HTMLImageElement>('.search-field > .search-icon');
      expect(icon.getAttribute('src')).toBe(IconDataUrl.search);
      expect(icon.getAttribute('alt')).toBe('');
      expect(icon.previousElementSibling).toBe(searchField());
    });

    it('is named in the application\'s language, and says which list it narrows down', async () => {
      await create('auto');
      expect(searchField().placeholder).toBe('Search');
      expect(searchField().getAttribute('aria-label')).toBe('Search');
      expect(searchField().getAttribute('aria-controls')).toBe(listbox().id);
      expect(listbox().id).not.toBe('');
    });

    it('leaves the entries that have what is typed in their name, their English name or their code', async () => {
      await create('auto');

      await search('deu');
      expect(labels()).toEqual(['Deutsch']);

      await search('German');
      expect(labels()).toEqual(['Deutsch']);

      await search('portug');
      expect(labels()).toEqual(['Português (Brasil)', 'Português (Portugal)']);

      await search('zh-hant');
      expect(labels()).toEqual(['繁體中文']);

      await search('日本');
      expect(labels()).toEqual(['日本語']);

      // The first entry is found by its text, which names the language that it stands for.
      await search('english');
      expect(labels()).toEqual([systemLanguageEntry, 'English']);
    });

    it('finds the operating system\'s entry by its text in that language, and by its text in the application\'s', async () => {
      await create('auto', 'darwin', ['ja-JP']);
      const entry = 'macOS の設定に従う（日本語）';

      await search('設定に従う');
      expect(labels()).toEqual([entry]);

      // What the entry says in English, the application's language: "Use macOS setting (日本語)".
      await search('setting');
      expect(labels()).toEqual([entry]);

      await search('日本');
      expect(labels()).toEqual([entry, '日本語']);
    });

    it('finds the operating system\'s entry in Arabic by its text as it reads, without the characters that keep the name on its own', async () => {
      await create('auto', 'darwin', ['ar-SA']);

      await search('macOS (العربية)');
      expect(labels()).toEqual(['استخدام إعداد macOS (\u2068العربية\u2069)']);
    });

    it('compares without regard to case, diacritics or the spaces around what is typed', async () => {
      await create('auto');

      await search('  CESTINA ');
      expect(labels()).toEqual(['Čeština']);

      await search('tieng viet');
      expect(labels()).toEqual(['Tiếng Việt']);
    });

    it('lists every entry again once it is cleared', async () => {
      await create('auto');
      await search('deu');

      await search('');

      expect(labels()).toHaveLength(languages.length + 1);
    });

    it('says that no language was found, in place of the entries', async () => {
      await create('auto');
      const message = () => host().querySelector('.no-languages');
      expect(message().getAttribute('role')).toBe('status');
      expect(message().textContent).toBe('');

      await search('no such language');

      expect(labels()).toEqual([]);
      expect(listbox().hidden).toBe(true);
      expect(message().textContent).toBe('No languages found');

      await search('');

      expect(listbox().hidden).toBe(false);
      expect(message().textContent).toBe('');
    });

    it('keeps the chosen entry chosen while it is not listed', async () => {
      await create('ja');

      await search('deu');
      expect(chosenLabels()).toEqual([]);
      expect(fixture.componentInstance.selected()).toBe('ja');

      await search('');
      expect(chosenLabels()).toEqual(['日本語']);
    });

    it('lets the user choose an entry that it found', async () => {
      await create('ja');
      const chosen: LanguageSetting[] = [];
      fixture.componentInstance.selected.subscribe(setting => chosen.push(setting));
      await search('deu');

      await click('Deutsch');

      expect(chosen).toEqual(['de']);
      expect(chosenLabels()).toEqual(['Deutsch']);

      await search('');
      expect(chosenLabels()).toEqual(['Deutsch']);
    });
  });
});
