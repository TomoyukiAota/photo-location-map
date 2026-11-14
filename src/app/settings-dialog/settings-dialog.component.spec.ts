import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import { BooleanSetting } from '../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../src-shared/user-settings/user-settings';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { AppearanceSettingsComponent } from './appearance-settings/appearance-settings.component';
import { CacheSettingsComponent } from './cache-settings/cache-settings.component';
import { DateTimeSettingsComponent } from './date-time-settings/date-time-settings.component';
import { LanguageSettingsComponent } from './language-settings/language-settings.component';
import { OsSettingsComponent } from './os-settings/os-settings.component';
import { RestoreSettingsService } from './service/restore-settings.service';
import { SettingsChangedService } from './service/settings-changed.service';
import { SettingsDialogComponent } from './settings-dialog.component';

// The tabs are left out: they tell the dialog about their changes through SettingsChangedService, as the tests do.
@Component({ selector: 'app-language-settings', template: '' })
class DummyLanguageSettingsComponent {}

@Component({ selector: 'app-appearance-settings', template: '' })
class DummyAppearanceSettingsComponent {}

@Component({ selector: 'app-date-time-settings', template: '' })
class DummyDateTimeSettingsComponent {}

@Component({ selector: 'app-os-settings', template: '' })
class DummyOsSettingsComponent {}

@Component({ selector: 'app-cache-settings', template: '' })
class DummyCacheSettingsComponent {}

describe('SettingsDialogComponent', () => {
  const close = vi.fn();
  const restore = vi.fn();
  const settingsInUse = { ...currentUserSettings };
  const otherShowStatusBar = settingsInUse.showStatusBar === BooleanSetting.TrueValue ? BooleanSetting.FalseValue : BooleanSetting.TrueValue;
  const otherDateFormat = DateTimeFormat.ForUser.DateFormat_List.find(format => format !== settingsInUse.dateFormat);
  const otherClockSystemFormat = DateTimeFormat.ForUser.ClockSystemFormat_List.find(format => format !== settingsInUse.clockSystemFormat);
  let fixture: ComponentFixture<SettingsDialogComponent>;
  let settingsChanged: SettingsChangedService;

  beforeEach(async () => {
    close.mockClear();
    restore.mockClear();
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: RestoreSettingsService, useValue: { restore } },
      ],
    })
      .overrideComponent(SettingsDialogComponent, {
        remove: { imports: [LanguageSettingsComponent, AppearanceSettingsComponent, DateTimeSettingsComponent, OsSettingsComponent, CacheSettingsComponent] },
        add: {
          imports: [
            DummyLanguageSettingsComponent, DummyAppearanceSettingsComponent, DummyDateTimeSettingsComponent, DummyOsSettingsComponent,
            DummyCacheSettingsComponent,
          ],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(SettingsDialogComponent);
    settingsChanged = TestBed.inject(SettingsChangedService);
    await fixture.whenStable();
  });

  afterEach(() => {
    Object.assign(currentUserSettings, settingsInUse); // Save changes the settings in use.
    vi.restoreAllMocks();
  });

  function saveButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.settings-dialog-footer-buttons button');
  }

  function isRestartNoticeShown(): boolean {
    const notice: HTMLElement = fixture.nativeElement.querySelector('.settings-dialog-footer-description');
    return notice.style.visibility === 'visible';
  }

  function tab(name: string): HTMLElement {
    const tabs = Array.from(fixture.nativeElement.querySelectorAll('mat-list-item') as NodeListOf<HTMLElement>);
    return tabs.find(item => item.textContent.trim() === name);
  }

  it('enables Save only while a setting differs from the one in use', async () => {
    expect(saveButton().disabled).toBe(true);

    settingsChanged.appearanceSettingsChanged.next({ showStatusBar: otherShowStatusBar });
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
    expect(isRestartNoticeShown()).toBe(false);

    settingsChanged.appearanceSettingsChanged.next({ showStatusBar: settingsInUse.showStatusBar });
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(true);
  });

  it('says that saving restarts the app while the date or the clock format differs', async () => {
    expect(isRestartNoticeShown()).toBe(false);

    settingsChanged.dateTimeSettingsChanged.next({ dateFormat: otherDateFormat, clockSystemFormat: settingsInUse.clockSystemFormat });
    await fixture.whenStable();
    expect(isRestartNoticeShown()).toBe(true);
    expect(saveButton().disabled).toBe(false);

    settingsChanged.dateTimeSettingsChanged.next({ dateFormat: settingsInUse.dateFormat, clockSystemFormat: otherClockSystemFormat });
    await fixture.whenStable();
    expect(isRestartNoticeShown()).toBe(true);

    settingsChanged.dateTimeSettingsChanged.next({ dateFormat: settingsInUse.dateFormat, clockSystemFormat: settingsInUse.clockSystemFormat });
    await fixture.whenStable();
    expect(isRestartNoticeShown()).toBe(false);
    expect(saveButton().disabled).toBe(true);
  });

  it('says that saving restarts the app while the language differs, and saves it once the restart is confirmed', async () => {
    const trackEvent = vi.spyOn(Analytics, 'trackEvent');
    expect(settingsInUse.language).toBe('auto');
    settingsChanged.languageSettingsChanged.next({ language: 'ja' });
    await fixture.whenStable();
    expect(isRestartNoticeShown()).toBe(true);
    expect(saveButton().disabled).toBe(false);

    settingsChanged.languageSettingsChanged.next({ language: 'auto' });
    await fixture.whenStable();
    expect(isRestartNoticeShown()).toBe(false);
    expect(saveButton().disabled).toBe(true);

    settingsChanged.languageSettingsChanged.next({ language: 'ja' });
    await fixture.whenStable();
    vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirm').mockResolvedValue(true);
    const restart = vi.spyOn(window.plm.app, 'restart');
    saveButton().click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(restart).toHaveBeenCalledTimes(1));
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.Language)).toBe('ja');
    // The new setting is recorded for analytics once it is saved, before the restart.
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith('User Setting', 'Changed User Setting', 'Language: ja');
    expect(trackEvent.mock.invocationCallOrder[0]).toBeLessThan(restart.mock.invocationCallOrder[0]);
  });

  it('saves a new status bar setting without a restart and closes', async () => {
    settingsChanged.appearanceSettingsChanged.next({ showStatusBar: otherShowStatusBar });
    await fixture.whenStable();

    saveButton().click();

    expect(currentUserSettings.showStatusBar).toBe(otherShowStatusBar);
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.ShowStatusBar)).toBe(otherShowStatusBar);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('asks before the restart, and saves nothing when it is declined', async () => {
    const confirm = vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirm').mockResolvedValue(false);
    settingsChanged.dateTimeSettingsChanged.next({ dateFormat: otherDateFormat, clockSystemFormat: settingsInUse.clockSystemFormat });
    await fixture.whenStable();

    saveButton().click();
    await fixture.whenStable();

    expect(confirm).toHaveBeenCalledWith('This application will restart after saving settings.\nDo you want to continue?');
    expect(currentUserSettings.dateFormat).toBe(settingsInUse.dateFormat);
    expect(close).not.toHaveBeenCalled();
  });

  it('opens on the Language tab, the first, and shows the tab chosen in the list', async () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('mat-list-item').textContent.trim()).toBe('Language');
    expect(tab('Language').classList).toContain('selected-tab');
    expect((host.querySelector('app-language-settings') as HTMLElement).style.display).toBe('block');

    tab('Cache').click();
    await fixture.whenStable();

    expect(tab('Cache').classList).toContain('selected-tab');
    expect(tab('Language').classList).not.toContain('selected-tab');
    expect((host.querySelector('app-cache-settings') as HTMLElement).style.display).toBe('block');
    expect((host.querySelector('app-language-settings') as HTMLElement).style.display).toBe('none');
    expect((host.querySelector('app-appearance-settings') as HTMLElement).style.display).toBe('none');
  });

  it('restores the settings in use and closes on Cancel', () => {
    const cancelButton: HTMLButtonElement = fixture.nativeElement.querySelector('.settings-dialog-cancel-button');
    cancelButton.click();

    expect(restore).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('stops listening to the tabs once it is closed', () => {
    expect(settingsChanged.appearanceSettingsChanged.observed).toBe(true);
    expect(settingsChanged.dateTimeSettingsChanged.observed).toBe(true);
    expect(settingsChanged.languageSettingsChanged.observed).toBe(true);

    fixture.destroy();

    expect(settingsChanged.appearanceSettingsChanged.observed).toBe(false);
    expect(settingsChanged.dateTimeSettingsChanged.observed).toBe(false);
    expect(settingsChanged.languageSettingsChanged.observed).toBe(false);
  });
});
