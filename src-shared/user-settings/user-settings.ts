import { DateTimeFormat } from '../date-time/date-time-format';
import { Logger } from '../log/logger';
import { RequireFromMainProcess } from '../require/require-from-main-process';
import { UserDataStorage } from '../user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../user-data-storage/user-data-stroage-path';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;
import ClockSystemFormatType = DateTimeFormat.ForUser.ClockSystemFormatType;

interface UserSettings {
  dateFormat: DateFormatType;
  clockSystemFormat: ClockSystemFormatType;
}

export class CurrentUserSettings implements UserSettings {
  constructor(public readonly dateFormat: DateFormatType,
              public readonly clockSystemFormat: ClockSystemFormatType) {}
}

export class UserSettingsToBeSaved implements UserSettings {
  public dateFormat: DateFormatType;
  public clockSystemFormat: ClockSystemFormatType;
}

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
  const dateFormat = loadDateFormat();
  const clockSystemFormat = loadClockSystemFormat();
  const userSettings = new CurrentUserSettings(dateFormat, clockSystemFormat);
  Logger.info(`Loaded user settings ${JSON.stringify(userSettings)}`);
  return userSettings;
};

export const currentUserSettings = loadUserSettings();

export const getUserSettingsToBeSaved: (() => UserSettingsToBeSaved) = () => {
  return {...currentUserSettings};
};

export const saveUserSettingsAndRestartApp: ((UserSettingsToBeSaved) => void) = (settings: UserSettingsToBeSaved) => {
  UserDataStorage.write(UserDataStoragePath.UserSettings.DateFormat, settings.dateFormat);
  UserDataStorage.write(UserDataStoragePath.UserSettings.ClockSystemFormat, settings.clockSystemFormat);
  Logger.info(`Saved user settings ${JSON.stringify(settings)}`);
  Logger.info(`User settings are saved, so the application will restart.`);
  RequireFromMainProcess.electron.app.relaunch();
  RequireFromMainProcess.electron.app.exit(0);
};
