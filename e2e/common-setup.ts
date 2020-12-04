const Application = require('spectron').Application;
const electronPath = require('electron'); // Get the path of electron.exe (Should be like "node_modules/electron/dist/electron.exe")
const path = require('path');

export default function setup() {
  beforeEach(async function () {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..')],   // tell Spectron to use package.json located 1 level above.
      webdriverOptions: {},
      startTimeout: 50000,
    });
    await this.app.start();
    const browser = this.app.client;
    await browser.waitUntilWindowLoaded(300000);
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });
}
