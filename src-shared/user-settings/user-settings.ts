import { Analytics } from '../analytics/analytics.js';
import { DateTimeFormat } from '../date-time/date-time-format.js';
import { isLanguageSetting, LanguageSetting, languageSettingAuto } from '../i18n/languages.js';
import { Logger } from '../log/logger.js';
import { restartApp } from '../process/restart-app.js';
import { UserDataStorage } from '../user-data-storage/user-data-storage.js';
import { UserDataStoragePath } from '../user-data-storage/user-data-stroage-path.js';
import { BooleanSetting, BooleanSettingType } from './boolean-setting.js';
import {
  defaultStickyFolderRowsLeftOut,
  defaultStickyFolderRowsMaximum,
  isStickyFolderRowsLeftOut,
  StickyFolderRowsLeftOut,
  stickyFolderRowsMaximumOf,
} from './sticky-folder-rows.js';
import { defaultThumbnailQuality, isThumbnailQuality, ThumbnailQuality } from './thumbnail-quality.js';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;
import ClockSystemFormatType = DateTimeFormat.ForUser.ClockSystemFormatType;

interface UserSettings {
  showStatusBar: BooleanSettingType;
  dateFormat: DateFormatType;
  clockSystemFormat: ClockSystemFormatType;
  /** `auto`, the operating system's language, or a language; the language in use is in src-shared/i18n/i18n.ts. */
  language: LanguageSetting;
  /** The quality of the thumbnails of HEIF photos (thumbnail-quality.ts). */
  thumbnailQuality: ThumbnailQuality;
  /** The most rows of folders that the folder tree keeps at its top while it is scrolled (sticky-folder-rows.ts). */
  stickyFolderRowsMaximum: number;
  /** Which folders those rows leave out when there are more folders than rows (sticky-folder-rows.ts). */
  stickyFolderRowsLeftOut: StickyFolderRowsLeftOut;
}

export class CurrentUserSettings implements UserSettings {
  constructor(public showStatusBar: BooleanSettingType,
              public dateFormat: DateFormatType,
              public clockSystemFormat: ClockSystemFormatType,
              public language: LanguageSetting,
              public thumbnailQuality: ThumbnailQuality,
              public stickyFolderRowsMaximum: number,
              public stickyFolderRowsLeftOut: StickyFolderRowsLeftOut) {}
}

export class UserSettingsToBeSaved implements UserSettings {
  public showStatusBar: BooleanSettingType;
  public dateFormat: DateFormatType;
  public clockSystemFormat: ClockSystemFormatType;
  public language: LanguageSetting;
  public thumbnailQuality: ThumbnailQuality;
  public stickyFolderRowsMaximum: number;
  public stickyFolderRowsLeftOut: StickyFolderRowsLeftOut;
}

const loadShowStatusBar: (() => BooleanSettingType) = () => {
  const loadedShowStatusBar: string = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.ShowStatusBar,
    BooleanSetting.TrueValue
  );

  const showStatusBar = BooleanSetting.isSettingValueValid(loadedShowStatusBar)
    ? loadedShowStatusBar as BooleanSettingType
    : BooleanSetting.TrueValue;

  return showStatusBar;
};

const loadDateFormat: (() => DateFormatType) = () => {
  const loadedDateFormat: string = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.DateFormat,
    DateTimeFormat.ForUser.DateFormat_Default);

  const isValidFormat = DateTimeFormat.ForUser.DateFormat_List.includes(loadedDateFormat as DateFormatType);
  const dateFormat = isValidFormat
    ? loadedDateFormat as DateFormatType
    : DateTimeFormat.ForUser.DateFormat_Default;
  return dateFormat;
};

const loadClockSystemFormat: (() => ClockSystemFormatType) = () => {
  const loadedClockSystemFormat: string = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.ClockSystemFormat,
    DateTimeFormat.ForUser.ClockSystemFormat_Default);

  const isValidFormat = DateTimeFormat.ForUser.ClockSystemFormat_List.includes(loadedClockSystemFormat as ClockSystemFormatType);
  const clockSystemFormat = isValidFormat
    ? loadedClockSystemFormat as ClockSystemFormatType
    : DateTimeFormat.ForUser.ClockSystemFormat_Default;
  return clockSystemFormat;
};

/** The saved Language setting, or `auto` when none is saved or the saved language is not one the application has. */
const loadLanguage: (() => LanguageSetting) = () => {
  const loadedLanguage: string = UserDataStorage.readOrDefault(UserDataStoragePath.UserSettings.Language, languageSettingAuto);
  return isLanguageSetting(loadedLanguage) ? loadedLanguage : languageSettingAuto;
};

/** The saved quality of the thumbnails of HEIF photos, or the default when none, or no valid one, is saved. */
const loadThumbnailQuality: (() => ThumbnailQuality) = () => {
  const loaded: string = UserDataStorage.readOrDefault(UserDataStoragePath.UserSettings.ThumbnailQuality, defaultThumbnailQuality);
  return isThumbnailQuality(loaded) ? loaded : defaultThumbnailQuality;
};

/** The saved most rows of the folders at the top of the folder tree, or the default when none, or no valid one, is saved. */
const loadStickyFolderRowsMaximum: (() => number) = () => {
  const loaded: string = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.StickyFolderRowsMaximum, String(defaultStickyFolderRowsMaximum));
  return stickyFolderRowsMaximumOf(loaded) ?? defaultStickyFolderRowsMaximum;
};

/** The saved choice of the folders that those rows leave out, or the default when none, or no valid one, is saved. */
const loadStickyFolderRowsLeftOut: (() => StickyFolderRowsLeftOut) = () => {
  const loaded: string = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.StickyFolderRowsLeftOut, defaultStickyFolderRowsLeftOut);
  return isStickyFolderRowsLeftOut(loaded) ? loaded : defaultStickyFolderRowsLeftOut;
};

const loadUserSettings: (() => CurrentUserSettings) = () => {
  const showStatusBar = loadShowStatusBar();
  const dateFormat = loadDateFormat();
  const clockSystemFormat = loadClockSystemFormat();
  const language = loadLanguage();
  const thumbnailQuality = loadThumbnailQuality();
  const stickyFolderRowsMaximum = loadStickyFolderRowsMaximum();
  const stickyFolderRowsLeftOut = loadStickyFolderRowsLeftOut();
  const userSettings = new CurrentUserSettings(showStatusBar, dateFormat, clockSystemFormat, language, thumbnailQuality,
    stickyFolderRowsMaximum, stickyFolderRowsLeftOut);
  Logger.info(`Loaded user settings ${JSON.stringify(userSettings)}`);
  return userSettings;
};

export const currentUserSettings = loadUserSettings();

/**
 * TL;DR: The Language setting as it was last loaded or saved, which a new one is recorded against for analytics.
 * Details: Not the one of currentUserSettings, which takes a new setting before it is written, and keeps it when
 * writing fails. The Language dialog lets its button be clicked again then, and a second try that saves the setting
 * would be compared with itself, so that the change would never be recorded.
 */
let savedLanguage: LanguageSetting = currentUserSettings.language;

export const getUserSettingsToBeSaved: (() => UserSettingsToBeSaved) = () => {
  return {...currentUserSettings};
};

function updateCurrentUserSettings(settings: UserSettingsToBeSaved): void {
  Object.assign(currentUserSettings, settings);
}

/**
 * Saves the settings; they apply at once in this process. The promise settles once they are written.
 * A new Language setting, chosen in the Language dialog or the Settings dialog, is recorded for analytics once it is
 * saved, as Photo Data Viewer records its own. Each launch records the setting and the language that the application
 * is in (src-main/record-at-app-launch.ts), the launch after the restart for a new language among them.
 */
export const saveUserSetting: ((settings: UserSettingsToBeSaved) => Promise<void>) = async (settings: UserSettingsToBeSaved) => {
  updateCurrentUserSettings(settings);
  await Promise.all([
    UserDataStorage.write(UserDataStoragePath.UserSettings.ShowStatusBar, settings.showStatusBar),
    UserDataStorage.write(UserDataStoragePath.UserSettings.DateFormat, settings.dateFormat),
    UserDataStorage.write(UserDataStoragePath.UserSettings.ClockSystemFormat, settings.clockSystemFormat),
    UserDataStorage.write(UserDataStoragePath.UserSettings.Language, settings.language),
    UserDataStorage.write(UserDataStoragePath.UserSettings.ThumbnailQuality, settings.thumbnailQuality),
    UserDataStorage.write(UserDataStoragePath.UserSettings.StickyFolderRowsMaximum, String(settings.stickyFolderRowsMaximum)),
    UserDataStorage.write(UserDataStoragePath.UserSettings.StickyFolderRowsLeftOut, settings.stickyFolderRowsLeftOut),
  ]);
  Logger.info(`Saved user settings ${JSON.stringify(settings)}`);
  if (settings.language !== savedLanguage) {
    savedLanguage = settings.language;
    Analytics.trackEvent('User Setting', 'Changed User Setting', `Language: ${settings.language}`);
  }
};

/**
 * Saves the settings, then restarts the app once they are written, for those that take effect only on launch. If a
 * setting could not be written, the app does not restart, and the failure is logged and recorded.
 */
export const saveUserSettingsAndRestartApp: ((settings: UserSettingsToBeSaved) => Promise<void>) = async (settings: UserSettingsToBeSaved) => {
  await saveUserSetting(settings);
  Logger.info(`User settings are saved, so the application will restart.`);
  restartApp();
};
