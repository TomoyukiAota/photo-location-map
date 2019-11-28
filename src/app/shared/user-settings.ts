import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { Logger } from '../../../src-shared/log/logger';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;
import ClockSystemFormatType = DateTimeFormat.ForUser.ClockSystemFormatType;

export class UserSettings {
  constructor(public readonly dateFormat: DateFormatType,
              public readonly clockSystemFormat: ClockSystemFormatType) {}
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

const loadUserSettings: (() => UserSettings) = () => {
  const dateFormat = loadDateFormat();
  const clockSystemFormat = loadClockSystemFormat();
  const userSettings = new UserSettings(dateFormat, clockSystemFormat);
  Logger.info(`Loaded user settings ${JSON.stringify(userSettings)}`);
  return userSettings;
};

export const loadedUserSettings = loadUserSettings();

export const saveUserSettings: ((UserSettings) => void) = (userSettings: UserSettings) => {
  UserDataStorage.write(UserDataStoragePath.UserSettings.DateFormat, userSettings.dateFormat);
  UserDataStorage.write(UserDataStoragePath.UserSettings.ClockSystemFormat, userSettings.clockSystemFormat);
  Logger.info(`Saved user settings ${JSON.stringify(userSettings)}`);
};
