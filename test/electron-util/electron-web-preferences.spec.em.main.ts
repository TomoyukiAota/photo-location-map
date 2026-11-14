import assert from 'assert';
import * as path from 'path';
import { mainWindowWebPreferences, photoDataViewerWebPreferences, rendererTestWebPreferences } from '../../electron-util/electron-web-preferences.js';

describe('The web preferences of the app\'s windows', () => {
  const appPath = path.resolve('/app');

  it('isolate the main window, with its preload from the app\'s folder', () => {
    assert.deepStrictEqual(mainWindowWebPreferences(appPath), {
      preload: path.join(appPath, 'electron-util', 'preload', 'main-window.cjs'),
      contextIsolation: true, nodeIntegration: false, nodeIntegrationInWorker: false, sandbox: true, webSecurity: false,
    });
  });

  it('isolate Photo Data Viewer\'s window, with a preload of its own and web security on', () => {
    assert.deepStrictEqual(photoDataViewerWebPreferences(appPath), {
      preload: path.join(appPath, 'electron-util', 'preload', 'photo-data-viewer.cjs'),
      contextIsolation: true, nodeIntegration: false, nodeIntegrationInWorker: false, sandbox: true,
    });
  });

  it('give electron-mocha\'s renderer tests Node.js, without a preload of the window', () => {
    assert.deepStrictEqual(rendererTestWebPreferences(), { contextIsolation: false, nodeIntegration: true, sandbox: false });
  });
});
