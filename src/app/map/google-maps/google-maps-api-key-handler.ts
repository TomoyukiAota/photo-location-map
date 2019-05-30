const app = window.require('electron').remote.app;
const path = window.require('path');
// const fs = window.require('fs');

export class GoogleMapsApiKeyHandler {
  private static readonly fileName = 'google-maps-api-key.json';
  private static filePath: string;
  private static apiKey: string;

  public static initialize() {
    this.filePath = path.join(window.require('electron').remote.app.getPath('userData'), GoogleMapsApiKeyHandler.fileName);
    this.apiKey = this.fetchApiKey();
  }

  public static fetchApiKey(): string {
    let apiKey = '';

    try {
      const fs = window.require('fs');
      const fileContent = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      apiKey = fileContent.apiKey;
    } catch (err) {
      // TODO: Log error cases.
    }

    return apiKey;
  }
}

GoogleMapsApiKeyHandler.initialize();
