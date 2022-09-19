import { v4 as uuidv4 } from 'uuid';
import { UserDataStorage } from '../../user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../user-data-storage/user-data-stroage-path';

export class AnalyticsConfig {
  public static get userId(): string {
    let userId: string;

    try {
      userId = UserDataStorage.read(UserDataStoragePath.Analytics.UserId);
    } catch {
      userId = uuidv4();
      UserDataStorage.write(UserDataStoragePath.Analytics.UserId, userId);
    }

    return userId;
  }
}
