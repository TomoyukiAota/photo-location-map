import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { languages as languagesOfApplication } from '../../../src-shared/i18n/languages';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import { currentUserSettings } from '../../../src-shared/user-settings/user-settings';
import { LanguageDialogComponent } from './language-dialog.component';

// The tests run in English, the operating system's language of the bridge's stand-in, with the Language setting auto.
describe('LanguageDialogComponent', () => {
  const close = vi.fn();
  const settingsInUse = { ...currentUserSettings };
  const platformInUse = startupMetadata().platform;
  let fixture: ComponentFixture<LanguageDialogComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    startupMetadata().platform = 'linux'; // The entry of the operating system's language names macOS and Windows.
    close.mockClear();
    await TestBed.configureTestingModule({
      imports: [LanguageDialogComponent],
      providers: [{ provide: MatDialogRef, useValue: { close } }],
    }).compileComponents();
    fixture = TestBed.createComponent(LanguageDialogComponent);
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    Object.assign(currentUserSettings, settingsInUse); // OK changes the settings in use.
    startupMetadata().platform = platformInUse;
    vi.restoreAllMocks();
  });

  function restartNote(): HTMLElement {
    return host.querySelector('.restart-note');
  }

  function languages(): HTMLElement[] {
    return Array.from(host.querySelectorAll<HTMLElement>('[role="option"]'));
  }

  function chosenLanguage(): string {
    return host.querySelector('[role="option"][aria-selected="true"]').textContent.trim();
  }

  function okButton(): HTMLButtonElement {
    return host.querySelector('.ok-button');
  }

  async function choose(label: string) {
    languages().find(language => language.textContent.trim() === label).click();
    await fixture.whenStable();
  }

  async function clickOk() {
    okButton().click();
    await fixture.whenStable();
  }

  function saved(storagePath: ReadonlyArray<string>): string {
    return UserDataStorage.readOrDefault(storagePath, 'not saved');
  }

  it('has the operating system\'s language chosen, and says nothing of a restart', () => {
    expect(host.querySelector('.language-dialog-title').textContent).toBe('Language');
    expect(languages().map(language => language.textContent.trim())).toEqual(['Use system setting (English)', ...languagesOfApplication.map(language => language.name)]);
    expect(chosenLanguage()).toBe('Use system setting (English)');
    expect(okButton().textContent.trim()).toBe('OK');
    expect(restartNote().style.visibility).toBe('hidden');
  });

  it('keeps the language on OK, remembers that the user confirmed it, and closes without a restart', async () => {
    const restart = vi.spyOn(window.plm.app, 'restart');
    const trackEvent = vi.spyOn(Analytics, 'trackEvent');

    await clickOk();

    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(saved(UserDataStoragePath.History.ClickedOkOnLanguageDialog)).toBe('true');
    expect(saved(UserDataStoragePath.UserSettings.Language)).toBe('auto');
    expect(restart).not.toHaveBeenCalled();
    // The setting did not change, so no change is recorded for analytics, only the click.
    expect(trackEvent.mock.calls).toEqual([['Language Dialog', '[Language Dialog] Clicked OK button', 'Language: auto']]);
  });

  it('closes without a restart for the language on screen chosen by its name, and saves that choice', async () => {
    const restart = vi.spyOn(window.plm.app, 'restart');
    const trackEvent = vi.spyOn(Analytics, 'trackEvent');
    await choose('English');
    expect(restartNote().style.visibility).toBe('hidden');
    expect(okButton().textContent.trim()).toBe('OK');

    await clickOk();

    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(saved(UserDataStoragePath.UserSettings.Language)).toBe('en');
    expect(restart).not.toHaveBeenCalled();
    // The setting changed from auto to English, the language on screen, which is recorded for analytics.
    expect(trackEvent).toHaveBeenCalledWith('User Setting', 'Changed User Setting', 'Language: en');
  });

  it('does nothing on a second click while the first is at work, so that the application restarts once', async () => {
    const restart = vi.spyOn(window.plm.app, 'restart');
    await choose('日本語');

    okButton().click();
    okButton().click();
    await fixture.whenStable();

    await vi.waitFor(() => expect(restart).toHaveBeenCalledTimes(1));
    // The application is quitting, so the button stays disabled.
    expect(okButton().disabled).toBe(true);
  });

  it('lets the button be clicked again when saving fails', async () => {
    vi.spyOn(UserDataStorage, 'write').mockRejectedValueOnce(new Error('The disk is full.'));

    await expect(fixture.componentInstance.onOkClicked()).rejects.toThrow('The disk is full.');
    await fixture.whenStable();

    expect(fixture.componentInstance.isSaving()).toBe(false);
    expect(okButton().disabled).toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it('records a new setting for analytics only once it is saved', async () => {
    const trackEvent = vi.spyOn(Analytics, 'trackEvent');
    await choose('English');
    // Writing the Language setting itself fails.
    vi.spyOn(UserDataStorage, 'write').mockImplementation(async storagePath => {
      if (storagePath === UserDataStoragePath.UserSettings.Language)
        throw new Error('The disk is full.');
    });

    await expect(fixture.componentInstance.onOkClicked()).rejects.toThrow('The disk is full.');

    expect(trackEvent).not.toHaveBeenCalledWith('User Setting', 'Changed User Setting', expect.anything());
  });

  it('says in the chosen language that the application will restart, names its button in it, and restarts once the choice is saved', async () => {
    const restart = vi.spyOn(window.plm.app, 'restart');
    await choose('日本語');
    expect(chosenLanguage()).toBe('日本語');
    expect(restartNote().style.visibility).toBe('visible');
    expect(restartNote().textContent.trim()).toBe('言語を適用するため、このアプリを再起動します。');
    expect(restartNote().getAttribute('lang')).toBe('ja');
    expect(okButton().textContent.trim()).toBe('決定');
    expect(okButton().getAttribute('lang')).toBe('ja');

    await clickOk();

    await vi.waitFor(() => expect(restart).toHaveBeenCalledTimes(1));
    expect(saved(UserDataStoragePath.History.ClickedOkOnLanguageDialog)).toBe('true');
    expect(saved(UserDataStoragePath.UserSettings.Language)).toBe('ja');
    expect(close).not.toHaveBeenCalled();
  });
});
