import assert = require('assert');
import { BrowserWindow } from 'electron';
import { AmplitudeAnalyticsBrowserIpcMain } from '../../../src-shared/analytics/ipc/amplitude-analytics-browser-ipc';
import { MixpanelBrowserIpcMain } from '../../../src-shared/analytics/ipc/mixpanel-browser-ipc';

// A stand-in for the main window: a destroyed BrowserWindow throws "Object has been destroyed" on any access to
// webContents, which is what made quitting fail on Windows.
function fakeWindow(isDestroyed: boolean, sent: unknown[][]): BrowserWindow {
  return {
    isDestroyed: () => isDestroyed,
    get webContents() {
      if (isDestroyed)
        throw new TypeError('Object has been destroyed');
      return { isDestroyed: () => false, send: (...args: unknown[]) => sent.push(args) };
    },
  } as unknown as BrowserWindow;
}

for (const [name, ipcMain] of [
  ['AmplitudeAnalyticsBrowserIpcMain', AmplitudeAnalyticsBrowserIpcMain],
  ['MixpanelBrowserIpcMain', MixpanelBrowserIpcMain],
] as const) {
  describe(name, () => {
    it('sendEventToRenderer should send the event to the main window', () => {
      const sent: unknown[][] = [];
      ipcMain.setMainWindow(fakeWindow(false, sent));
      ipcMain.sendEventToRenderer('App Quit', 'App Quit', 'Session Length (s): 1', 1);
      assert.equal(sent.length, 1);
      assert.deepEqual(sent[0].slice(1), ['App Quit', 'App Quit', 'Session Length (s): 1', 1]);
    });

    it('sendEventToRenderer should skip the event when the main window is destroyed, as when quitting on Windows', () => {
      const sent: unknown[][] = [];
      ipcMain.setMainWindow(fakeWindow(true, sent));
      ipcMain.sendEventToRenderer('App Quit', 'App Quit', 'Session Length (s): 1', 1);
      assert.equal(sent.length, 0);
    });

    it('sendEventToRenderer should skip the event before the main window is set', () => {
      ipcMain.setMainWindow(undefined);
      ipcMain.sendEventToRenderer('App Launch', 'App Launch');
    });
  });
}
