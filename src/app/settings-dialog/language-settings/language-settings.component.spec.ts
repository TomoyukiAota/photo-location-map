import { ComponentFixture, TestBed } from '@angular/core/testing';
import { startupMetadata } from '../../../../src-shared/startup/startup-metadata';
import { SettingsChangedService } from '../service/settings-changed.service';
import { LanguageSettingsChangedParameter } from './language-settings-changed-parameter';
import { LanguageSettingsComponent } from './language-settings.component';

describe('LanguageSettingsComponent', () => {
  const platformInUse = startupMetadata().platform;
  let fixture: ComponentFixture<LanguageSettingsComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    startupMetadata().platform = 'linux'; // The entry of the operating system's language names macOS and Windows.
    await TestBed.configureTestingModule({ imports: [LanguageSettingsComponent] }).compileComponents();
    fixture = TestBed.createComponent(LanguageSettingsComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    startupMetadata().platform = platformInUse;
  });

  function languages(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('[role="option"]'));
  }

  function chosenLanguage(): string {
    return host.querySelector('[role="option"][aria-selected="true"]').textContent.trim();
  }

  it('shows the Language setting in use, and that a change takes effect after a restart', () => {
    expect(host.querySelector('.setting-title').textContent).toBe('Language');
    expect(host.querySelector('.description-row').textContent.trim()).toBe('The language will be changed after application restart.');
    expect(languages().map(language => language.textContent.trim())).toEqual(['Use system setting (English)', 'English', '日本語']);
    expect(chosenLanguage()).toBe('Use system setting (English)');
  });

  it('tells the Settings dialog the language that the user chose', async () => {
    const changes: LanguageSettingsChangedParameter[] = [];
    TestBed.inject(SettingsChangedService).languageSettingsChanged.subscribe(change => changes.push(change));

    languages().find(language => language.textContent.trim() === '日本語').click();
    await fixture.whenStable();

    expect(changes).toEqual([{ language: 'ja' }]);
    expect(chosenLanguage()).toBe('日本語');
  });
});
