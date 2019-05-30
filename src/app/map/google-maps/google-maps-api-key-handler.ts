const app = window.require('electron').remote.app;
const fs = window.require('fs');
const path = window.require('path');

export class GoogleMapsApiKeyHandler {
  private static readonly fileName = 'google-maps-api-key.json';
  private static filePath: string;
  private static apiKey: string;

  public static initialize() {
    this.filePath = path.join(app.getPath('userData'), GoogleMapsApiKeyHandler.fileName);
    this.apiKey = this.fetchApiKey();
  }

  public static fetchApiKey(): string {
    let apiKey = '';

    try {
      const fileContent = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      apiKey = fileContent.apiKey;
    } catch (err) {
      // TODO: Log error cases.
    }

    return apiKey;
  }
}

GoogleMapsApiKeyHandler.initialize();
