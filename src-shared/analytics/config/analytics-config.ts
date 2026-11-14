import { v4 as uuidv4 } from 'uuid';
import { ProcessIdentifier } from '../../process/process-identifier.js';
import { UserDataStorage } from '../../user-data-storage/user-data-storage.js';
import { UserDataStoragePath } from '../../user-data-storage/user-data-stroage-path.js';

export class AnalyticsConfig {
  /** The ID of this device's user: the one saved, or a new one, which only the main process saves. */
  public static get userId(): string {
    let userId: string;

    try {
      userId = UserDataStorage.read(UserDataStoragePath.Analytics.UserId);
    } catch {
      userId = uuidv4();
      // Only the main process saves the user ID. It makes it before a renderer gets its copy of the settings
      // (src-main/user-data-storage/), so a renderer without one could not save it: its copy cannot be newer.
      if (ProcessIdentifier.isElectronMain)
        UserDataStorage.write(UserDataStoragePath.Analytics.UserId, userId);
    }

    return userId;
  }
}
