const Application = require('spectron').Application;
const electronPath = require('electron'); // Get the path of electron.exe (Should be like "node_modules/electron/dist/electron.exe")
const path = require('path');

export default function setup() {
  beforeEach(async function () {
    this.app = new Application({
      path: electronPath,
      // The following line tells spectron to look and use the main.js file
      // and the package.json located 1 level above.
      args: [path.join(__dirname, '..')],
      webdriverOptions: {}
    });
    await this.app.start();
    const browser = this.app.client;
    await browser.waitUntilWindowLoaded(30000);

    browser.timeouts('script', 30000);
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });
}
