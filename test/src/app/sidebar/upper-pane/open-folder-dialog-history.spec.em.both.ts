import assert from 'assert';
import * as path from 'path';
import { OpenFolderDialogHistory, OpenFolderDialogHistoryDependencies } from '../../../../../src/app/sidebar/upper-pane/open-folder-dialog-history.js';

describe('OpenFolderDialogHistory', () => {
  const firstDirectory = path.resolve('folder-history-first');
  const secondDirectory = path.resolve('folder-history-second');
  let saved: unknown;
  let failures: unknown[];
  let writes: string[];
  let directoryChecks: string[];

  function createHistory(overrides: Partial<OpenFolderDialogHistoryDependencies> = {}, timeoutMs = 1000) {
    return new OpenFolderDialogHistory({
      read: () => saved,
      write: value => { saved = value; writes.push(value); },
      isDirectory: async value => { directoryChecks.push(value); return true; },
      reportFailure: error => failures.push(error),
      ...overrides,
    }, timeoutMs);
  }

  function deferredDirectoryCheck() {
    let resolve: (value: boolean) => void;
    let reject: (reason: Error) => void;
    const promise = new Promise<boolean>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    return { promise, resolve, reject };
  }

  async function beforeDeadline<T>(promise: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Folder-history lookup did not return in time.')), 1000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
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

  it('bounds an unavailable directory lookup and shares it across concurrent and later picker calls', async () => {
    saved = firstDirectory;
    const check = deferredDirectoryCheck();
    const history = createHistory({ isDirectory: value => {
      directoryChecks.push(value);
      return check.promise;
    } }, 20);

    const results = await beforeDeadline(Promise.all([
      history.getDefaultPath(), history.getDefaultPath(), history.getDefaultPath(),
    ]));
    assert.deepEqual(results, [undefined, undefined, undefined]);
    assert.deepEqual(await beforeDeadline(Promise.all([
      history.getDefaultPath(), history.getDefaultPath(),
    ])), [undefined, undefined]);
    assert.deepEqual(directoryChecks, [firstDirectory]);
    assert.equal(saved, firstDirectory);
    assert.deepEqual(writes, []);
  });

  it('uses a directory lookup that completes before the deadline', async () => {
    saved = firstDirectory;
    const check = deferredDirectoryCheck();
    const history = createHistory({ isDirectory: () => check.promise }, 100);
    const result = history.getDefaultPath();
    await new Promise(resolve => setTimeout(resolve, 5));
    check.resolve(true);
    assert.equal(await beforeDeadline(result), firstDirectory);
  });

  it('allows a fresh lookup after a timed-out directory check eventually completes', async () => {
    saved = firstDirectory;
    const check = deferredDirectoryCheck();
    let attempts = 0;
    const history = createHistory({ isDirectory: () => ++attempts === 1 ? check.promise : Promise.resolve(true) }, 20);
    assert.equal(await beforeDeadline(history.getDefaultPath()), undefined);
    check.resolve(true);
    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(await beforeDeadline(history.getDefaultPath()), firstDirectory);
    assert.equal(attempts, 2);
  });

  it('consumes a late lookup rejection and allows a later retry', async () => {
    saved = firstDirectory;
    const check = deferredDirectoryCheck();
    let attempts = 0;
    const history = createHistory({ isDirectory: () => ++attempts === 1 ? check.promise : Promise.resolve(true) }, 20);
    const unhandledRejections: unknown[] = [];
    const recordUnhandledRejection = reason => unhandledRejections.push(reason);
    process.on('unhandledRejection', recordUnhandledRejection);
    try {
      assert.equal(await beforeDeadline(history.getDefaultPath()), undefined);
      check.reject(new Error('Network directory became unavailable.'));
      await new Promise(resolve => setTimeout(resolve, 0));
      assert.equal(await beforeDeadline(history.getDefaultPath()), firstDirectory);
      assert.equal(attempts, 2);
      assert.deepEqual(unhandledRejections, []);
    } finally {
      process.removeListener('unhandledRejection', recordUnhandledRejection);
    }
  });

  it('checks a new selection independently without duplicating a still-pending check for the earlier folder', async () => {
    saved = firstDirectory;
    const check = deferredDirectoryCheck();
    const history = createHistory({ isDirectory: value => {
      directoryChecks.push(value);
      return value === firstDirectory ? check.promise : Promise.resolve(true);
    } }, 20);
    const firstLookup = history.getDefaultPath();
    history.rememberSelection({ canceled: false, filePaths: [secondDirectory] });
    assert.equal(await beforeDeadline(history.getDefaultPath()), secondDirectory);
    assert.equal(await beforeDeadline(firstLookup), undefined);

    history.rememberSelection({ canceled: false, filePaths: [firstDirectory] });
    assert.equal(await beforeDeadline(history.getDefaultPath()), undefined);
    assert.deepEqual(directoryChecks, [firstDirectory, secondDirectory]);
    assert.deepEqual(writes, [secondDirectory, firstDirectory]);
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
