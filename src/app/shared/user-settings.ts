import { DateTimeFormat } from '../../../src-shared/date-time/date-time-format';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import DateFormatType = DateTimeFormat.ForUser.DateFormatType;

export class UserSettings {
  public dateFormat: string;
  public clockSystemFormat: string;
}

const loadDateFormat: (() => string) = () => {
  const loadedDateFormat = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.DateFormat,
    DateTimeFormat.ForUser.Date_Default);

  const isValidFormat = DateTimeFormat.ForUser.dateFormatList.includes(loadedDateFormat as DateFormatType);
  const dateFormat = isValidFormat ? loadedDateFormat : DateTimeFormat.ForUser.Date_Default;
  return dateFormat;
};

const loadClockSystemFormat: (() => string) = () => {
  const loadedClockSystemFormat = UserDataStorage.readOrDefault(
    UserDataStoragePath.UserSettings.ClockSystemFormat,
    DateTimeFormat.ForUser.ClockSystem_Default);

  const isValidFormat = DateTimeFormat.ForUser.clockSystemFormatList.includes(loadedClockSystemFormat as DateFormatType);
  const clockSystemFormat = isValidFormat ? loadedClockSystemFormat : DateTimeFormat.ForUser.ClockSystem_Default;
  return clockSystemFormat;
};

const loadUserSettings: (() => UserSettings) = () => {
  const userSettings = new UserSettings();
  userSettings.dateFormat = loadDateFormat();
  userSettings.clockSystemFormat = loadClockSystemFormat();
  return userSettings;
};

export const loadedUserSettings = loadUserSettings();

export const saveUserSettings: ((UserSettings) => void) = (userSettings: UserSettings) => {
  UserDataStorage.write(UserDataStoragePath.UserSettings.DateFormat, userSettings.dateFormat);
  UserDataStorage.write(UserDataStoragePath.UserSettings.ClockSystemFormat, userSettings.clockSystemFormat);
};
