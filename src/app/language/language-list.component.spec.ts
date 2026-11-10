import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSetting } from '../../../src-shared/i18n/languages';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata';
import { LanguageListComponent } from './language-list.component';

// The tests run in English, the operating system's language of the bridge's stand-in.
describe('LanguageListComponent', () => {
  const platformInUse = startupMetadata().platform;
  let fixture: ComponentFixture<LanguageListComponent>;

  afterEach(() => {
    startupMetadata().platform = platformInUse;
  });

  function listbox(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector('[role="listbox"]');
  }

  /** The entries of the list, with the text and the language of their names. */
  function items() {
    return Array.from(listbox().querySelectorAll<HTMLElement>('[role="option"]')).map(element => ({
      label: element.textContent.trim(),
      labelLanguage: element.getAttribute('lang'),
      selected: element.getAttribute('aria-selected') === 'true',
      element,
    }));
  }

  /** Creates the list on `platform`, which the entry of the operating system's language is named after. */
  async function create(selected: LanguageSetting, platform = 'linux') {
    startupMetadata().platform = platform;
    await TestBed.configureTestingModule({ imports: [LanguageListComponent] }).compileComponents();
    fixture = TestBed.createComponent(LanguageListComponent);
    fixture.componentRef.setInput('selected', selected);
    await fixture.whenStable();
  }

  it('lists the operating system\'s language first, with the language it stands for, then each language under its own name', async () => {
    await create('auto');
    expect(items().map(({ label, labelLanguage }) => ({ label, labelLanguage }))).toEqual([
      { label: 'Use system setting (English)', labelLanguage: 'en' },
      { label: 'English', labelLanguage: 'en' },
      { label: '日本語', labelLanguage: 'ja' },
    ]);
  });

  it.each([
    ['darwin', 'Use macOS setting (English)'],
    ['win32', 'Use Windows setting (English)'],
    ['linux', 'Use system setting (English)'],
  ])('on %s, names the operating system\'s language "%s"', async (platform, label) => {
    await create('auto', platform);
    expect(items().map(item => item.label)).toEqual([label, 'English', '日本語']);
  });

  it('is a list box of which one entry is chosen', async () => {
    await create('auto');
    expect(listbox().getAttribute('aria-label')).toBe('Language');
    expect(listbox().getAttribute('aria-multiselectable')).toBe('false');
    expect(items().map(item => item.selected)).toEqual([true, false, false]);
  });

  it('shows the Language setting that it is given as the chosen one', async () => {
    await create('ja');
    expect(items().map(item => item.selected)).toEqual([false, false, true]);
  });

  it('tells which Language setting the user chose', async () => {
    await create('auto');
    const chosen: LanguageSetting[] = [];
    fixture.componentInstance.selected.subscribe(setting => chosen.push(setting));

    items()[2].element.click();
    await fixture.whenStable();

    expect(chosen).toEqual(['ja']);
    expect(fixture.componentInstance.selected()).toBe('ja');
    expect(items().map(item => item.selected)).toEqual([false, false, true]);
  });

  it('keeps an entry chosen when the user clicks it again, as one is always chosen', async () => {
    await create('auto');
    const chosen: LanguageSetting[] = [];
    fixture.componentInstance.selected.subscribe(setting => chosen.push(setting));

    items()[0].element.click();
    await fixture.whenStable();

    expect(chosen).toEqual([]);
    expect(items().map(item => item.selected)).toEqual([true, false, false]);
  });
});
