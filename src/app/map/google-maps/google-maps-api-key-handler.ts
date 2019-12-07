import { Logger } from '../../../../src-shared/log/logger';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { RequireFromMainProcess } from '../../../../src-shared/require/require-from-main-process';

export class GoogleMapsApiKeyHandler {
  private static readonly filePath = UserDataStorage.getFilePath(UserDataStoragePath.GoogleMaps.ApiKey);

  public static fetchApiKey(): string {
    if (!RequireFromMainProcess.fsExtra.existsSync(this.filePath)) {
      Logger.warn(`The file for Google Maps API Key does not exist.`);
      this.logHowToUseGoogleMapsMessage();
      return '';
    }

    return this.fetchApiKeyFromFile();
  }

  private static fetchApiKeyFromFile(): string {
    let apiKey = '';

    try {
      apiKey = UserDataStorage.read(UserDataStoragePath.GoogleMaps.ApiKey);
      Logger.info(`Fetched Google Maps API Key "${apiKey}" from "${this.filePath}".`);
    } catch (error) {
      Logger.warn(`Failed to fetch Google Maps API Key from "${this.filePath}".`, error);
      this.logHowToUseGoogleMapsMessage();
    }

    return apiKey;
  }

  private static logHowToUseGoogleMapsMessage() {
    Logger.info(`The Google Maps API Key will be '' (empty string).`);
    Logger.warn(`To use Google Maps, create "${this.filePath}" with file content "{ "ApiKey": "YOUR_API_KEY" }"`);
  }
}
