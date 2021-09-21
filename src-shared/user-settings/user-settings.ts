import { DateTimeFormat } from '../date-time/date-time-format';
import { Logger } from '../log/logger';
import { RequireFromMainProcess } from '../require/require-from-main-process';
import { UserDataStorage } from '../user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../user-data-storage/user-data-stroage-path';
import { BooleanSetting, BooleanSettingType } from './boolean-setting';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;
import ClockSystemFormatType = DateTimeFormat.ForUser.ClockSystemFormatType;

interface UserSettings {
  showStatusBar: BooleanSettingType;
  dateFormat: DateFormatType;
  clockSystemFormat: ClockSystemFormatType;
}

export class CurrentUserSettings implements UserSettings {
  constructor(public showStatusBar: BooleanSettingType,
              public dateFormat: DateFormatType,
              public clockSystemFormat: ClockSystemFormatType) {}
}

export class UserSettingsToBeSaved implements UserSettings {
  public showStatusBar: BooleanSettingType;
  public dateFormat: DateFormatType;
  public clockSystemFormat: ClockSystemFormatType;
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

const loadUserSettings: (() => CurrentUserSettings) = () => {
  const showStatusBar = loadShowStatusBar();
  const dateFormat = loadDateFormat();
  const clockSystemFormat = loadClockSystemFormat();
  const userSettings = new CurrentUserSettings(showStatusBar, dateFormat, clockSystemFormat);
  Logger.info(`Loaded user settings ${JSON.stringify(userSettings)}`);
  return userSettings;
};

export const currentUserSettings = loadUserSettings();

export const getUserSettingsToBeSaved: (() => UserSettingsToBeSaved) = () => {
  return {...currentUserSettings};
};

function updateCurrentUserSettings(settings: UserSettingsToBeSaved): void {
  Object.assign(currentUserSettings, settings);
}

export const saveUserSetting:  ((UserSettingsToBeSaved) => void) = (settings: UserSettingsToBeSaved) => {
  updateCurrentUserSettings(settings);
  UserDataStorage.write(UserDataStoragePath.UserSettings.ShowStatusBar, settings.showStatusBar);
  UserDataStorage.write(UserDataStoragePath.UserSettings.DateFormat, settings.dateFormat);
  UserDataStorage.write(UserDataStoragePath.UserSettings.ClockSystemFormat, settings.clockSystemFormat);
  Logger.info(`Saved user settings ${JSON.stringify(settings)}`);
};

export const saveUserSettingsAndRestartApp: ((UserSettingsToBeSaved) => void) = (settings: UserSettingsToBeSaved) => {
  saveUserSetting(settings);
  Logger.info(`User settings are saved, so the application will restart.`);
  RequireFromMainProcess.electron.app.relaunch();
  RequireFromMainProcess.electron.app.exit(0);
};
