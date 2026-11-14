import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { AnalyticsBackendIpcChannelName } from '../../src-main/analytics/analytics-backend-ipc.js';
import { AmplitudeAnalyticsBrowserIpcChannelName } from '../../src-shared/analytics/ipc/amplitude-analytics-browser-ipc.js';
import { MixpanelBrowserIpcChannelName } from '../../src-shared/analytics/ipc/mixpanel-browser-ipc.js';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { repositoryPath } from '../test-util/repository.js';

// The main window's preload (electron-util/preload/main-window.cjs), run as Electron runs a sandboxed preload: a
// function with its own require, here with stand-ins for contextBridge and ipcRenderer that record what it does.

const preloadPath = repositoryPath('electron-util', 'preload', 'main-window.cjs');
const startup = { version: '9.9.9-test' };

interface Call { method: 'send' | 'sendSync' | 'invoke'; channel: string; args: unknown[]; }
type Listener = (event: unknown, ...args: unknown[]) => void;

function runPreload(contextIsolated: boolean) {
  const calls: Call[] = [];
  const listeners = new Map<string, Listener[]>();
  const required: string[] = [];
  const exposed: { key: string, api: any }[] = [];
  const dispatched: string[] = [];
  const window: { plm?: any, dispatchEvent(event: { type: string }): void } = { dispatchEvent: event => { dispatched.push(event.type); } };
  const ipcRenderer = {
    send: (channel: string, ...args: unknown[]) => { calls.push({ method: 'send', channel, args }); },
    sendSync: (channel: string, ...args: unknown[]) => {
      calls.push({ method: 'sendSync', channel, args });
      return channel === IpcConstants.StartupMetadata.Get ? startup : { setting: 'value' };
    },
    invoke: (channel: string, ...args: unknown[]) => {
      calls.push({ method: 'invoke', channel, args });
      return Promise.resolve(`answer of ${channel}`);
    },
    on: (channel: string, listener: Listener) => { listeners.set(channel, [...(listeners.get(channel) ?? []), listener]); },
    removeListener: (channel: string, listener: Listener) => {
      listeners.set(channel, (listeners.get(channel) ?? []).filter(registered => registered !== listener));
    },
  };
  const contextBridge = { exposeInMainWorld: (key: string, api: unknown) => { exposed.push({ key, api }); } };
  /** The require of a sandboxed preload, which has only electron. */
  const sandboxRequire = (name: string) => {
    required.push(name);
    if (name === 'electron') return { contextBridge, ipcRenderer };
    throw new Error(`A sandboxed preload cannot require ${name}.`);
  };
  const source = fs.readFileSync(preloadPath, 'utf8');
  // The DOM's Event, which the preload dispatches on window.
  const context = { Event: class { constructor(public readonly type: string) {} } };
  const preload = vm.runInNewContext(`(function (require, process, window) {\n${source}\n})`, context, { filename: preloadPath });
  preload(sandboxRequire, { contextIsolated }, window);
  /** Sends `args` on `channel` to the preload's listeners, as the main process would. */
  const emit = (channel: string, ...args: unknown[]) => (listeners.get(channel) ?? []).forEach(listener => listener({ sender: 'the IPC event' }, ...args));
  return { calls, listeners, required, exposed, window, emit, dispatched };
}

describe('The main window\'s preload', () => {
  it('requires only electron, gives an isolated page window.plm through contextBridge, then says that it is there', () => {
    const { required, exposed, window, dispatched } = runPreload(true);
    assert.deepStrictEqual(required, ['electron']);
    assert.deepStrictEqual(exposed.map(({ key }) => key), ['plm']);
    assert.strictEqual(window.plm, undefined);
    assert.deepStrictEqual(dispatched, ['plm-bridge-ready']);
  });

  it('sets window.plm itself where the page shares its world, as in electron-mocha\'s renderer tests', () => {
    const { exposed, window } = runPreload(false);
    assert.deepStrictEqual(exposed, []);
    assert.strictEqual(window.plm.version, 1);
  });

  it('asks for the startup metadata once, synchronously, before the page runs', () => {
    const { calls, exposed } = runPreload(true);
    assert.deepStrictEqual(calls, [{ method: 'sendSync', channel: IpcConstants.StartupMetadata.Get, args: [] }]);
    assert.strictEqual(exposed[0].api.startup, startup);
  });

  it('sends each operation on its channel, with only its own arguments', async () => {
    const photoSelection = { isUndoMenuEnabled: true, isRedoMenuEnabled: false };
    const viewerParams = { photo: { name: 'a.jpg', path: '/photos/a.jpg' } };
    const operations: [(plm: any) => unknown, Call][] = [
      [plm => plm.storage.snapshot(), { method: 'sendSync', channel: IpcConstants.UserDataStorage.Snapshot, args: [] }],
      [plm => plm.storage.write(['A', 'B'], 'v'), { method: 'invoke', channel: IpcConstants.UserDataStorage.Write, args: [['A', 'B'], 'v'] }],
      [plm => plm.log.append('a line'), { method: 'send', channel: IpcConstants.Log.Append, args: ['a line'] }],
      [plm => plm.analytics.sendToBackend('C', 'A', 'L', 1), { method: 'send', channel: AnalyticsBackendIpcChannelName.trackEvent, args: ['C', 'A', 'L', 1] }],
      [plm => plm.folderDialog.show({ defaultPath: '/photos' }), { method: 'invoke', channel: IpcConstants.FolderDialog.Show, args: [{ defaultPath: '/photos' }] }],
      [plm => plm.folderDialog.isDirectory('/photos'), { method: 'invoke', channel: IpcConstants.FolderDialog.IsDirectory, args: ['/photos'] }],
      [plm => plm.exif.read('/photos/a.jpg'), { method: 'invoke', channel: IpcConstants.Exif.Read, args: ['/photos/a.jpg'] }],
      [plm => plm.directoryTree.create('/photos'), { method: 'invoke', channel: IpcConstants.DirectoryTree.Create, args: ['/photos'] }],
      [plm => plm.thumbnails.generate(['/a.heic', '/b.heic'], ['/b.heic']),
        { method: 'invoke', channel: IpcConstants.ThumbnailGenerationInMainProcess.Name, args: [['/a.heic', '/b.heic'], ['/b.heic']] }],
      [plm => plm.thumbnails.state(['/a.heic']), { method: 'invoke', channel: IpcConstants.ThumbnailCache.State, args: [['/a.heic']] }],
      [plm => plm.thumbnailCache.open(), { method: 'invoke', channel: IpcConstants.ThumbnailCache.Open, args: [] }],
      [plm => plm.thumbnailCache.deleteAndRestart(), { method: 'invoke', channel: IpcConstants.ThumbnailCache.DeleteAndRestart, args: [] }],
      [plm => plm.shell.openExternal('https://example.com/'), { method: 'invoke', channel: IpcConstants.Shell.OpenExternal, args: ['https://example.com/'] }],
      [plm => plm.shell.openWithAssociatedApp('/photos/a.jpg'), { method: 'invoke', channel: IpcConstants.Shell.OpenWithAssociatedApp, args: ['/photos/a.jpg'] }],
      [plm => plm.shell.openContainingFolder('/photos/a.jpg'), { method: 'invoke', channel: IpcConstants.Shell.OpenContainingFolder, args: ['/photos/a.jpg'] }],
      [plm => plm.app.restart(), { method: 'send', channel: IpcConstants.AppRestart.Request, args: [] }],
      [plm => plm.commandLine.openTarget(), { method: 'invoke', channel: IpcConstants.CommandLineOptions.OpenTarget, args: [] }],
      [plm => plm.menus.updateUndoRedo(photoSelection), { method: 'invoke', channel: IpcConstants.PhotoSelection.UpdateUndoRedoMenus, args: [photoSelection] }],
      [plm => plm.photoDataViewer.open(viewerParams), { method: 'invoke', channel: IpcConstants.PhotoDataViewer.Name, args: [viewerParams] }],
      [plm => plm.explorerContextMenu.add(), { method: 'invoke', channel: IpcConstants.ExplorerContextMenu.Add, args: [] }],
      [plm => plm.explorerContextMenu.remove(), { method: 'invoke', channel: IpcConstants.ExplorerContextMenu.Remove, args: [] }],
    ];
    for (const [operation, expected] of operations) {
      const { calls, exposed } = runPreload(true);
      calls.length = 0;
      const answer = await operation(exposed[0].api);
      assert.deepStrictEqual(calls, [expected]);
      if (expected.method === 'invoke') assert.strictEqual(answer, `answer of ${expected.channel}`);
      if (expected.method === 'sendSync') assert.deepStrictEqual(answer, { setting: 'value' });
      if (expected.method === 'send') assert.strictEqual(answer, undefined);
    }
  });

  it('gives each event to its listener without the IPC event, until the listener is removed', () => {
    const events: [string, string, unknown[]][] = [
      ['onAboutBox', IpcConstants.AboutBox.Name, []],
      ['onManageSettings', IpcConstants.ManageSettings.Name, []],
      ['onWelcomeDialog', IpcConstants.WelcomeDialog.Name, []],
      ['onUndo', IpcConstants.PhotoSelection.Undo, []],
      ['onRedo', IpcConstants.PhotoSelection.Redo, []],
      ['onRecordAtAppLaunchFinished', IpcConstants.RecordAtAppLaunch.Finished, []],
    ];
    for (const [name, channel, args] of events) {
      const { exposed, emit, listeners } = runPreload(true);
      // The preload listens from its start, once for each channel.
      assert.strictEqual(listeners.get(channel)?.length, 1, name);
      const received: unknown[][] = [];
      const unsubscribe = exposed[0].api.events[name]((...eventArgs: unknown[]) => received.push(eventArgs));
      emit(channel, ...args);
      unsubscribe();
      emit(channel, ...args);
      assert.deepStrictEqual(received, [args], name);
    }
    for (const [name, channel] of [
      ['onAmplitudeEvent', AmplitudeAnalyticsBrowserIpcChannelName.trackEvent],
      ['onMixpanelEvent', MixpanelBrowserIpcChannelName.trackEvent],
    ]) {
      const { exposed, emit } = runPreload(true);
      const received: unknown[][] = [];
      exposed[0].api.analytics[name]((...eventArgs: unknown[]) => received.push(eventArgs));
      emit(channel, 'Category', 'Action', 'Label', 3);
      assert.deepStrictEqual(received, [['Category', 'Action', 'Label', 3]], name);
    }
  });

  it('keeps what comes before the page listens for its first listener, given after subscribe returns', async () => {
    const { exposed, emit } = runPreload(true);
    emit(IpcConstants.RecordAtAppLaunch.Finished);
    emit(AmplitudeAnalyticsBrowserIpcChannelName.trackEvent, 'App', 'Launch', 'first');
    emit(AmplitudeAnalyticsBrowserIpcChannelName.trackEvent, 'App', 'Launch', 'second');
    const finished: unknown[][] = [];
    const amplitude: unknown[][] = [];
    exposed[0].api.events.onRecordAtAppLaunchFinished((...args: unknown[]) => finished.push(args));
    exposed[0].api.analytics.onAmplitudeEvent((...args: unknown[]) => amplitude.push(args));
    assert.deepStrictEqual([finished, amplitude], [[], []]);
    await Promise.resolve();
    assert.deepStrictEqual(finished, [[]]);
    assert.deepStrictEqual(amplitude, [['App', 'Launch', 'first'], ['App', 'Launch', 'second']]);
    // Once the page listens, what comes while no listener is there is not kept.
    const later: unknown[][] = [];
    exposed[0].api.events.onUndo(() => {})();
    emit(IpcConstants.PhotoSelection.Undo);
    exposed[0].api.events.onUndo((...args: unknown[]) => later.push(args));
    await Promise.resolve();
    assert.deepStrictEqual(later, []);
  });

  it('keeps at most 1000 messages of a channel before the page listens', async () => {
    const { exposed, emit } = runPreload(true);
    for (let index = 0; index < 1005; index++) emit(MixpanelBrowserIpcChannelName.trackEvent, 'C', `A ${index}`);
    const received: unknown[][] = [];
    exposed[0].api.analytics.onMixpanelEvent((...args: unknown[]) => received.push(args));
    await Promise.resolve();
    assert.strictEqual(received.length, 1000);
    assert.deepStrictEqual(received.at(-1), ['C', 'A 999']);
  });

  it('refuses a listener that is not a function', () => {
    const { exposed } = runPreload(true);
    // A TypeError of the preload's own context, as in Electron's isolated world.
    assert.throws(() => exposed[0].api.events.onUndo('not a function'), { name: 'TypeError', message: 'A listener must be a function.' });
  });

  it('gives the page no generic way to the main process, Node.js or a shell', () => {
    const { exposed } = runPreload(true);
    const api = exposed[0].api;
    assert.deepStrictEqual(Object.keys(api), ['version', 'startup', 'storage', 'log', 'analytics', 'folderDialog', 'exif',
      'directoryTree', 'thumbnails', 'thumbnailCache', 'shell', 'app', 'commandLine', 'menus', 'photoDataViewer',
      'explorerContextMenu', 'events']);
    const memberNames = Object.values(api).flatMap(member => typeof member === 'object' && member !== null ? Object.keys(member) : []);
    for (const generic of ['send', 'sendSync', 'invoke', 'on', 'require', 'ipcRenderer', 'process', 'exec', 'spawn', 'readFile'])
      assert(!memberNames.includes(generic), generic);
  });
});
