import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { AnalyticsBackendIpcChannelName } from '../../src-main/analytics/analytics-backend-ipc.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { repositoryPath } from '../test-util/repository.js';

// Photo Data Viewer's preload (electron-util/preload/photo-data-viewer.cjs), run as Electron runs a sandboxed preload,
// with stand-ins for contextBridge and ipcRenderer.

const preloadPath = repositoryPath('electron-util', 'preload', 'photo-data-viewer.cjs');

function runPreload() {
  const calls: { method: string, channel: string, args: unknown[] }[] = [];
  const exposed: { key: string, api: any }[] = [];
  const dispatched: string[] = [];
  const required: string[] = [];
  const ipcRenderer = {
    send: (channel: string, ...args: unknown[]) => { calls.push({ method: 'send', channel, args }); },
    invoke: (channel: string, ...args: unknown[]) => { calls.push({ method: 'invoke', channel, args }); return Promise.resolve('the photo'); },
  };
  const contextBridge = { exposeInMainWorld: (key: string, api: unknown) => { exposed.push({ key, api }); } };
  /** The require of a sandboxed preload, which has only electron. */
  const sandboxRequire = (name: string) => {
    required.push(name);
    if (name === 'electron') return { contextBridge, ipcRenderer };
    throw new Error(`A sandboxed preload cannot require ${name}.`);
  };
  const window = { dispatchEvent: (event: { type: string }) => { dispatched.push(event.type); } };
  const context = { Event: class { constructor(public readonly type: string) {} } };
  const source = fs.readFileSync(preloadPath, 'utf8');
  vm.runInNewContext(`(function (require, process, window) {\n${source}\n})`, context, { filename: preloadPath })(sandboxRequire, { contextIsolated: true }, window);
  return { calls, exposed, dispatched, required };
}

describe('Photo Data Viewer\'s preload', () => {
  it('requires only electron, gives the page window.plmPhotoDataViewer, then says that it is there', () => {
    const { exposed, dispatched, required, calls } = runPreload();
    assert.deepStrictEqual(required, ['electron']);
    assert.deepStrictEqual(exposed.map(({ key }) => key), ['plmPhotoDataViewer']);
    assert.deepStrictEqual(Object.keys(exposed[0].api), ['version', 'readPhoto', 'trackEvent']);
    assert.strictEqual(exposed[0].api.version, 1);
    assert.deepStrictEqual(dispatched, ['plm-photo-data-viewer-bridge-ready']);
    assert.deepStrictEqual(calls, []);
  });

  it('asks for the window\'s photo, and sends analytics on the channel of the viewer\'s legacy path', async () => {
    const { exposed, calls } = runPreload();
    assert.strictEqual(await exposed[0].api.readPhoto(), 'the photo');
    exposed[0].api.trackEvent('Photo Data Viewer', '[PDV] Loaded Photo', 'label', 'value');
    assert.deepStrictEqual(calls, [
      { method: 'invoke', channel: IpcConstants.PhotoDataViewer.Photo, args: [] },
      { method: 'send', channel: AnalyticsBackendIpcChannelName.trackEvent, args: ['Photo Data Viewer', '[PDV] Loaded Photo', 'label', 'value'] },
    ]);
  });
});
