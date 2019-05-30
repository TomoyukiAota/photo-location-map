import { Logger } from '../../../../src-shared/log/logger';

const app = window.require('electron').remote.app;
const fs = window.require('fs');
const path = window.require('path');

export class GoogleMapsApiKeyHandler {
  private static readonly fileName = 'google-maps-api-key.json';
  private static readonly filePath = path.join(app.getPath('userData'), GoogleMapsApiKeyHandler.fileName);

  public static fetchApiKey(): string {
    if (!fs.existsSync(this.filePath)) {
      Logger.info(`The file for Google Maps API Key does not exist.`);
      this.logHowToUseGoogleMapsMessage();
      return '';
    }

    return this.fetchApiKeyFromFile();
  }

  private static fetchApiKeyFromFile(): string {
    let apiKey = '';

    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf8');
      const jsonObject = JSON.parse(fileContent);
      apiKey = jsonObject.apiKey;
      Logger.info(`Fetched Google Maps API Key "${apiKey}" from "${this.filePath}".`);
    } catch (error) {
      Logger.warn(`Failed to fetch Google Maps API Key from "${this.filePath}".`, error);
      this.logHowToUseGoogleMapsMessage();
    }

    return apiKey;
  }

  private static logHowToUseGoogleMapsMessage() {
    Logger.info(`The Google Maps API Key will be '' (empty string).`);
    Logger.info(`To use Google Maps, create "${this.filePath}" with file content "{ "apiKey": "YOUR_API_KEY" }"`);
  }
}
