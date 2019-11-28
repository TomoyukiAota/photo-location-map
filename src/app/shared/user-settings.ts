import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;

export class UserSettings {
  constructor(public readonly dateFormat: string,
              public readonly clockSystemFormat: string) {}
}

const loadDateFormat: (() => string) = () => {
  const loadedDateFormat = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.DateFormat,
    DateTimeFormat.ForUser.DateFormat_Default);

  const isValidFormat = DateTimeFormat.ForUser.DateFormat_List.includes(loadedDateFormat as DateFormatType);
  const dateFormat = isValidFormat ? loadedDateFormat : DateTimeFormat.ForUser.DateFormat_Default;
  return dateFormat;
};

const loadClockSystemFormat: (() => string) = () => {
  const loadedClockSystemFormat = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.ClockSystemFormat,
    DateTimeFormat.ForUser.ClockSystemFormat_Default);

  const isValidFormat = DateTimeFormat.ForUser.ClockSystemFormat_List.includes(loadedClockSystemFormat as DateFormatType);
  const clockSystemFormat = isValidFormat ? loadedClockSystemFormat : DateTimeFormat.ForUser.ClockSystemFormat_Default;
  return clockSystemFormat;
};

const loadUserSettings: (() => UserSettings) = () => {
  const dateFormat = loadDateFormat();
  const clockSystemFormat = loadClockSystemFormat();
  const userSettings = new UserSettings(dateFormat, clockSystemFormat);
  return userSettings;
};

export const loadedUserSettings = loadUserSettings();

export const saveUserSettings: ((UserSettings) => void) = (userSettings: UserSettings) => {
  UserDataStorage.write(UserDataStoragePath.UserSettings.DateFormat, userSettings.dateFormat);
  UserDataStorage.write(UserDataStoragePath.UserSettings.ClockSystemFormat, userSettings.clockSystemFormat);
};
