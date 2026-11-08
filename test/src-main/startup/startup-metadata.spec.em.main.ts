import assert = require('assert');
import { app } from 'electron';
import { createStartupMetadata, startupMetadata } from '../../../src-shared/startup/startup-metadata';

describe('startupMetadata (in main process)', () => {
  it('gives the version and the settings directory of the app', () => {
    const standIn = { getVersion: () => '9.9.9-test', getPath: (name: string) => `/data/${name}` } as unknown as Electron.App;
    assert.deepStrictEqual(createStartupMetadata(standIn), { version: '9.9.9-test', userDataPath: '/data/userData' });
  });

  it('reads the real app in the main process, as the renderer gets it', () => {
    assert.deepStrictEqual(startupMetadata(), { version: app.getVersion(), userDataPath: app.getPath('userData') });
  });
});
