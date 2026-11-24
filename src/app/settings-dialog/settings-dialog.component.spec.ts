import { Component, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { currentPlatform } from '../../../src-shared/startup/startup-metadata';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import { BooleanSetting } from '../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../src-shared/user-settings/user-settings';
import { HeifThumbnailService } from '../heif-thumbnail/heif-thumbnail.service';
import { JpegPngThumbnailService } from '../jpeg-png-thumbnail/jpeg-png-thumbnail.service';
import { ThumbnailSizeService } from '../shared/thumbnail-size/thumbnail-size.service';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { DirTreeViewStickyRowsService } from '../directory-tree-view/dir-tree-view-sticky-rows/dir-tree-view-sticky-rows.service';
import { AppearanceSettingsChangedParameter } from './appearance-settings/appearance-settings-changed-parameter';
import { AppearanceSettingsComponent } from './appearance-settings/appearance-settings.component';
import { CacheTabComponent } from './cache-tab/cache-tab.component';
import { DateTimeSettingsComponent } from './date-time-settings/date-time-settings.component';
import { LanguageSettingsComponent } from './language-settings/language-settings.component';
import { OsSettingsComponent } from './os-settings/os-settings.component';
import { RestoreSettingsService } from './service/restore-settings.service';
import { SettingsChangedService } from './service/settings-changed.service';
import { SettingsDialogComponent } from './settings-dialog.component';
import { ThumbnailSettingsComponent } from './thumbnail-settings/thumbnail-settings.component';

// The tabs are left out: they tell the dialog about their changes through SettingsChangedService, as the tests do.
@Component({ selector: 'app-language-settings', template: '' })
class DummyLanguageSettingsComponent {}

@Component({ selector: 'app-appearance-settings', template: '' })
class DummyAppearanceSettingsComponent {}

@Component({ selector: 'app-date-time-settings', template: '' })
class DummyDateTimeSettingsComponent {}

@Component({ selector: 'app-os-settings', template: '' })
class DummyOsSettingsComponent {}

@Component({ selector: 'app-thumbnail-settings', template: '' })
class DummyThumbnailSettingsComponent {}

@Component({ selector: 'app-cache-tab', template: '' })
class DummyCacheTabComponent {
  public readonly openThumbnailsTab = output<void>();
}

describe('SettingsDialogComponent', () => {
  const close = vi.fn();
  const restore = vi.fn();
  const applyThumbnailSettings = vi.fn(async () => false);
  const applyJpegPngSettings = vi.fn(async () => {});
  const settingsInUse = { ...currentUserSettings };
  const otherShowStatusBar = settingsInUse.showStatusBar === BooleanSetting.TrueValue ? BooleanSetting.FalseValue : BooleanSetting.TrueValue;
  /** What the Appearance tab tells the dialog, all of its settings: those in use, but for `changed`. */
  const appearance = (changed: Partial<AppearanceSettingsChangedParameter> = {}): AppearanceSettingsChangedParameter => ({
    showStatusBar: settingsInUse.showStatusBar,
    stickyFolderRowsMaximum: settingsInUse.stickyFolderRowsMaximum,
    stickyFolderRowsLeftOut: settingsInUse.stickyFolderRowsLeftOut,
    ...changed,
  });
  const otherDateFormat = DateTimeFormat.ForUser.DateFormat_List.find(format => format !== settingsInUse.dateFormat);
  const otherClockSystemFormat = DateTimeFormat.ForUser.ClockSystemFormat_List.find(format => format !== settingsInUse.clockSystemFormat);
  let fixture: ComponentFixture<SettingsDialogComponent>;
  let settingsChanged: SettingsChangedService;

  /** Makes the dialog, given what it is opened with. */
  async function createDialog(data: unknown = null): Promise<void> {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(SettingsDialogComponent);
    settingsChanged = TestBed.inject(SettingsChangedService);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    close.mockClear();
    restore.mockClear();
    applyThumbnailSettings.mockClear();
    applyJpegPngSettings.mockClear();
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close } },
        { provide: RestoreSettingsService, useValue: { restore } },
        { provide: HeifThumbnailService, useValue: { applyThumbnailSettings } },
        { provide: JpegPngThumbnailService, useValue: { applySettings: applyJpegPngSettings } },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    })
      .overrideComponent(SettingsDialogComponent, {
        remove: {
          imports: [LanguageSettingsComponent, AppearanceSettingsComponent, DateTimeSettingsComponent, OsSettingsComponent,
            ThumbnailSettingsComponent, CacheTabComponent],
        },
        add: {
          imports: [
            DummyLanguageSettingsComponent, DummyAppearanceSettingsComponent, DummyDateTimeSettingsComponent, DummyOsSettingsComponent,
            DummyThumbnailSettingsComponent, DummyCacheTabComponent,
          ],
        },
      })
      .compileComponents();
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
    await createDialog();
    expect(saveButton().disabled).toBe(true);

    settingsChanged.appearanceSettingsChanged.next(appearance({ showStatusBar: otherShowStatusBar }));
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
    expect(isRestartNoticeShown()).toBe(false);

    settingsChanged.appearanceSettingsChanged.next(appearance());
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(true);
  });

  it('says that saving restarts the app while the date or the clock format differs', async () => {
    await createDialog();
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
    await createDialog();
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
    vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirmIn').mockResolvedValue(true);
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
    await createDialog();
    settingsChanged.appearanceSettingsChanged.next(appearance({ showStatusBar: otherShowStatusBar }));
    await fixture.whenStable();

    saveButton().click();

    expect(currentUserSettings.showStatusBar).toBe(otherShowStatusBar);
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.ShowStatusBar)).toBe(otherShowStatusBar);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('saves the rows kept at the top of the folder tree without a restart, and the tree takes them at once', async () => {
    await createDialog();
    const stickyRows = TestBed.inject(DirTreeViewStickyRowsService);
    const otherMaximum = settingsInUse.stickyFolderRowsMaximum === 4 ? 5 : 4;
    settingsChanged.appearanceSettingsChanged.next(appearance({ stickyFolderRowsMaximum: otherMaximum }));
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
    expect(isRestartNoticeShown()).toBe(false);
    settingsChanged.appearanceSettingsChanged.next(appearance());
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(true);

    settingsChanged.appearanceSettingsChanged.next(appearance({ stickyFolderRowsMaximum: otherMaximum, stickyFolderRowsLeftOut: 'nearPhotos' }));
    await fixture.whenStable();
    saveButton().click();

    expect(currentUserSettings.stickyFolderRowsMaximum).toBe(otherMaximum);
    expect(currentUserSettings.stickyFolderRowsLeftOut).toBe('nearPhotos');
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.StickyFolderRowsMaximum)).toBe(String(otherMaximum));
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.StickyFolderRowsLeftOut)).toBe('nearPhotos');
    expect(stickyRows.maximum()).toBe(otherMaximum);
    expect(stickyRows.leftOut()).toBe('nearPhotos');
    expect(close).toHaveBeenCalledTimes(1);
    // The settings in use again, for the tests after this one.
    Object.assign(currentUserSettings, settingsInUse);
    stickyRows.applySettings();
  });

  it('asks before the restart, and saves nothing when it is declined', async () => {
    await createDialog();
    const confirm = vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirmIn').mockResolvedValue(false);
    settingsChanged.dateTimeSettingsChanged.next({ dateFormat: otherDateFormat, clockSystemFormat: settingsInUse.clockSystemFormat });
    await fixture.whenStable();

    saveButton().click();
    await fixture.whenStable();

    // In the application's language, as the language setting is the one in use.
    expect(confirm).toHaveBeenCalledWith('en', 'This application will restart after saving settings.\nDo you want to continue?');
    expect(currentUserSettings.dateFormat).toBe(settingsInUse.dateFormat);
    expect(close).not.toHaveBeenCalled();
  });

  it('says what saving does in the language chosen on the Language tab, as its user reads it, and asks in it before the restart', async () => {
    await createDialog();
    const host: HTMLElement = fixture.nativeElement;
    const notice: HTMLElement = host.querySelector('.settings-dialog-footer-description');
    const cancelButton: HTMLButtonElement = host.querySelector('.settings-dialog-cancel-button');
    /** The texts of the footer, with the lang and dir of each. */
    const footer = () => [notice, saveButton(), cancelButton]
      .map(element => [element.textContent.trim(), element.getAttribute('lang'), element.getAttribute('dir')]);
    // The setting in use, auto, is English here, the operating system's language of the tests.
    expect(footer()).toEqual([
      ['This application will restart after saving settings.', 'en', 'ltr'], ['Save', 'en', 'ltr'], ['Cancel', 'en', 'ltr'],
    ]);

    settingsChanged.languageSettingsChanged.next({ language: 'ja' });
    await fixture.whenStable();
    expect(footer()).toEqual([['設定を保存すると、このアプリは再起動します。', 'ja', 'ltr'], ['保存', 'ja', 'ltr'], ['キャンセル', 'ja', 'ltr']]);
    const confirm = vi.spyOn(TestBed.inject(ConfirmDialogService), 'confirmIn').mockResolvedValue(false);
    saveButton().click();
    await fixture.whenStable();
    expect(confirm).toHaveBeenCalledExactlyOnceWith('ja', '設定を保存すると、このアプリは再起動します。\n続けますか？');

    // Arabic is written from right to left, in the footer laid out as the application is.
    settingsChanged.languageSettingsChanged.next({ language: 'ar' });
    await fixture.whenStable();
    expect(footer()).toEqual([['سيُعاد تشغيل هذا التطبيق بعد حفظ الإعدادات.', 'ar', 'rtl'], ['حفظ', 'ar', 'rtl'], ['إلغاء', 'ar', 'rtl']]);

    // Back to the setting in use: the application's language again, with nothing to say.
    settingsChanged.languageSettingsChanged.next({ language: 'auto' });
    await fixture.whenStable();
    expect(footer()[1]).toEqual(['Save', 'en', 'ltr']);
    expect(isRestartNoticeShown()).toBe(false);
  });

  it('opens on the Language tab, the first, and shows the tab chosen in the list', async () => {
    await createDialog();
    const host: HTMLElement = fixture.nativeElement;
    // The OS tab is there on Windows only.
    const names = Array.from(host.querySelectorAll('mat-list-item'), item => item.textContent.trim());
    expect(names).toEqual(['Language', 'Appearance', 'Date & Time', 'Thumbnails', ...(currentPlatform() === 'win32' ? ['OS'] : []), 'Cache']);
    expect(tab('Language').classList).toContain('selected-tab');
    expect((host.querySelector('app-language-settings') as HTMLElement).style.display).toBe('block');

    tab('Thumbnails').click();
    await fixture.whenStable();

    expect(tab('Thumbnails').classList).toContain('selected-tab');
    expect(tab('Language').classList).not.toContain('selected-tab');
    expect((host.querySelector('app-thumbnail-settings') as HTMLElement).style.display).toBe('block');
    expect((host.querySelector('app-language-settings') as HTMLElement).style.display).toBe('none');
    expect((host.querySelector('app-appearance-settings') as HTMLElement).style.display).toBe('none');
  });

  it('saves a new quality of thumbnails without a restart, and has the thumbnails made again', async () => {
    await createDialog();
    const otherQuality = settingsInUse.thumbnailQuality === 'high' ? 'fast' : 'high';
    settingsChanged.thumbnailSettingsChanged.next({ thumbnailQuality: otherQuality, thumbnailSize: settingsInUse.thumbnailSize });
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
    expect(isRestartNoticeShown()).toBe(false);

    saveButton().click();

    expect(currentUserSettings.thumbnailQuality).toBe(otherQuality);
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.ThumbnailQuality)).toBe(otherQuality);
    expect(applyThumbnailSettings).toHaveBeenCalledOnce();
    expect(applyJpegPngSettings).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('saves a new size of thumbnails without a restart, shows the thumbnails in their new box, and has them made again', async () => {
    await createDialog();
    const otherSize = settingsInUse.thumbnailSize === 800 ? 600 : 800;
    settingsChanged.thumbnailSettingsChanged.next({ thumbnailQuality: 'high', thumbnailSize: otherSize });
    await fixture.whenStable();
    expect(saveButton().disabled).toBe(false);
    expect(isRestartNoticeShown()).toBe(false);

    saveButton().click();

    expect(currentUserSettings.thumbnailSize).toBe(otherSize);
    expect(UserDataStorage.read(UserDataStoragePath.UserSettings.ThumbnailSize)).toBe(String(otherSize));
    expect(TestBed.inject(ThumbnailSizeService).box()).toBe(`${otherSize / 2}px`);
    expect(applyThumbnailSettings).toHaveBeenCalledOnce();
    expect(applyJpegPngSettings).toHaveBeenCalledOnce();
  });

  it('makes no thumbnail again when the thumbnails\' settings are saved as they were', async () => {
    await createDialog();
    settingsChanged.thumbnailSettingsChanged.next({ thumbnailQuality: settingsInUse.thumbnailQuality, thumbnailSize: settingsInUse.thumbnailSize });
    settingsChanged.appearanceSettingsChanged.next(appearance({ showStatusBar: otherShowStatusBar }));
    await fixture.whenStable();

    saveButton().click();

    expect(applyThumbnailSettings).not.toHaveBeenCalled();
    expect(applyJpegPngSettings).not.toHaveBeenCalled();
  });

  it('opens the Thumbnails tab, where the cache of the thumbnails is, from the Cache tab', async () => {
    await createDialog({ initialTab: 'cache' });
    const host: HTMLElement = fixture.nativeElement;
    expect((host.querySelector('app-cache-tab') as HTMLElement).style.display).toBe('block');

    fixture.debugElement.query(By.directive(DummyCacheTabComponent)).componentInstance.openThumbnailsTab.emit();
    await fixture.whenStable();

    expect(tab('Thumbnails').classList).toContain('selected-tab');
    expect((host.querySelector('app-thumbnail-settings') as HTMLElement).style.display).toBe('block');
    expect((host.querySelector('app-cache-tab') as HTMLElement).style.display).toBe('none');
  });

  it('opens on the tab that it is opened with, as the Thumbnails tab from the status bar of thumbnails', async () => {
    await createDialog({ initialTab: 'thumbnails' });
    expect(tab('Thumbnails').classList).toContain('selected-tab');
    expect((fixture.nativeElement.querySelector('app-thumbnail-settings') as HTMLElement).style.display).toBe('block');
  });

  it('restores the settings in use and closes on Cancel', async () => {
    await createDialog();
    const cancelButton: HTMLButtonElement = fixture.nativeElement.querySelector('.settings-dialog-cancel-button');
    cancelButton.click();

    expect(restore).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('stops listening to the tabs once it is closed', async () => {
    await createDialog();
    expect(settingsChanged.appearanceSettingsChanged.observed).toBe(true);
    expect(settingsChanged.dateTimeSettingsChanged.observed).toBe(true);
    expect(settingsChanged.languageSettingsChanged.observed).toBe(true);

    fixture.destroy();

    expect(settingsChanged.appearanceSettingsChanged.observed).toBe(false);
    expect(settingsChanged.dateTimeSettingsChanged.observed).toBe(false);
    expect(settingsChanged.languageSettingsChanged.observed).toBe(false);
  });
});
