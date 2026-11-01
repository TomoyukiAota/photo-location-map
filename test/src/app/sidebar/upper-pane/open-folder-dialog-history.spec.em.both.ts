import assert = require('assert');
import * as path from 'path';
import { OpenFolderDialogHistory, OpenFolderDialogHistoryDependencies } from '../../../../../src/app/sidebar/upper-pane/open-folder-dialog-history';

describe('OpenFolderDialogHistory', () => {
  const firstDirectory = path.resolve('folder-history-first');
  const secondDirectory = path.resolve('folder-history-second');
  let saved: unknown;
  let failures: unknown[];
  let writes: string[];
  let directoryChecks: string[];

  function createHistory(overrides: Partial<OpenFolderDialogHistoryDependencies> = {}) {
    return new OpenFolderDialogHistory({
      read: () => saved,
      write: value => { saved = value; writes.push(value); },
      isDirectory: async value => { directoryChecks.push(value); return true; },
      reportFailure: error => failures.push(error),
      ...overrides,
    });
  }

  beforeEach(() => {
    saved = undefined;
    failures = [];
    writes = [];
    directoryChecks = [];
  });

  it('leaves the default unspecified when no confirmed history exists', async () => {
    assert.equal(await createHistory().getDefaultPath(), undefined);
    assert.deepEqual(directoryChecks, []);
  });

  it('restores the selected folder itself in a fresh history instance', async () => {
    const history = createHistory();
    assert.equal(history.rememberSelection({ canceled: false, filePaths: [firstDirectory] }), firstDirectory);
    assert.equal(await createHistory().getDefaultPath(), firstDirectory);
    assert.deepEqual(writes, [firstDirectory]);
    assert.deepEqual(directoryChecks, [firstDirectory]);
  });

  it('ignores non-string and relative saved values without checking the filesystem', async () => {
    for (const invalid of [null, 42, {}, 'relative-folder']) {
      saved = invalid;
      assert.equal(await createHistory().getDefaultPath(), undefined);
    }
    assert.deepEqual(directoryChecks, []);
  });

  it('does not pass a removed folder or ordinary file as the default directory', async () => {
    saved = firstDirectory;
    assert.equal(await createHistory({ isDirectory: async () => false }).getDefaultPath(), undefined);
  });

  it('still allows the picker when stored history cannot be read', async () => {
    const failure = new Error('Unreadable history');
    const history = createHistory({ read: () => { throw failure; } });
    assert.equal(await history.getDefaultPath(), undefined);
    assert.deepEqual(failures, [failure]);
  });

  it('still allows the picker when its previous directory cannot be inspected', async () => {
    saved = firstDirectory;
    const failure = new Error('Directory unavailable');
    const history = createHistory({ isDirectory: async () => { throw failure; } });
    assert.equal(await history.getDefaultPath(), undefined);
    assert.deepEqual(failures, [failure]);
  });

  it('keeps confirmed history when the picker is canceled or returns no selection', async () => {
    saved = firstDirectory;
    const history = createHistory();
    assert.equal(history.rememberSelection({ canceled: true, filePaths: [] }), undefined);
    assert.equal(history.rememberSelection({ canceled: false, filePaths: [] }), undefined);
    assert.equal(await history.getDefaultPath(), firstDirectory);
    assert.deepEqual(writes, []);
  });

  it('replaces confirmed history after a new successful selection', async () => {
    saved = firstDirectory;
    const history = createHistory();
    assert.equal(history.rememberSelection({ canceled: false, filePaths: [secondDirectory] }), secondDirectory);
    assert.equal(await createHistory().getDefaultPath(), secondDirectory);
  });

  it('opens the selected folder and remembers it for this session when persistence fails', async () => {
    saved = firstDirectory;
    const failure = new Error('Read-only settings');
    const history = createHistory({ write: () => { throw failure; } });
    assert.equal(history.rememberSelection({ canceled: false, filePaths: [secondDirectory] }), secondDirectory);
    assert.equal(await history.getDefaultPath(), secondDirectory);
    assert.equal(saved, firstDirectory);
    assert.deepEqual(failures, [failure]);
  });
});
