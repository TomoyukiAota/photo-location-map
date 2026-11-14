import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ThumbnailCachePaths, thumbnailStates } from '../../../src-main/thumbnail-generation/thumbnail-state.js';

describe('thumbnailStates (in main process)', () => {
  let root: string;
  // A cache in a temporary folder, not the user's: the file's thumbnail and log beside it, in "cache".
  let paths: ThumbnailCachePaths;
  /** Writes the log of `srcFilePath`'s thumbnail: `content` as it is when a string, or as JSON. */
  const writeLog = (srcFilePath: string, content: unknown) =>
    fs.writeFileSync(paths.logFilePath(srcFilePath), typeof content === 'string' ? content : JSON.stringify(content));
  const mtimeOf = (filePath: string) => fs.statSync(filePath).mtime.toISOString();

  before(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-thumbnail-state-'));
    fs.mkdirSync(path.join(root, 'cache'));
    paths = {
      thumbnailFilePath: srcFilePath => path.join(root, 'cache', `${path.basename(srcFilePath)}.plm.jpg`),
      logFilePath: srcFilePath => path.join(root, 'cache', `${path.basename(srcFilePath)}.log.json`),
    };
    for (const name of ['made.heic', 'failed.heic', 'changed.heic', 'pending.heic', 'broken-log.heic'])
      fs.writeFileSync(path.join(root, name), '');
  });
  after(() => fs.rmSync(root, { recursive: true, force: true }));

  it('tells a made thumbnail from a failed one, one of an older file, and one not attempted yet', async () => {
    const file = (name: string) => path.join(root, name);
    writeLog(file('made.heic'), { LastModified: mtimeOf(file('made.heic')), IsThumbnailFileCreated: true });
    fs.writeFileSync(paths.thumbnailFilePath(file('made.heic')), 'jpeg');
    writeLog(file('failed.heic'), { LastModified: mtimeOf(file('failed.heic')), IsThumbnailFileCreated: false });
    writeLog(file('changed.heic'), { LastModified: '2000-01-01T00:00:00.000Z', IsThumbnailFileCreated: true });
    fs.writeFileSync(paths.thumbnailFilePath(file('changed.heic')), 'jpeg');
    writeLog(file('broken-log.heic'), '{ not JSON');

    const states = await thumbnailStates(['made.heic', 'failed.heic', 'changed.heic', 'pending.heic', 'broken-log.heic'].map(file), paths);
    assert.deepStrictEqual(states.map(({ attemptFinished, cacheAvailable }) => ({ attemptFinished, cacheAvailable })), [
      { attemptFinished: true, cacheAvailable: true },
      { attemptFinished: true, cacheAvailable: false },
      { attemptFinished: false, cacheAvailable: false },
      { attemptFinished: false, cacheAvailable: false },
      { attemptFinished: false, cacheAvailable: false },
    ]);
    assert.strictEqual(states[0].thumbnailFilePath, paths.thumbnailFilePath(file('made.heic')));
  });

  it('reports a file that cannot be checked, such as one deleted since, as having no thumbnail', async () => {
    const deleted = path.join(root, 'deleted.heic');
    fs.writeFileSync(deleted, '');
    writeLog(deleted, { LastModified: mtimeOf(deleted), IsThumbnailFileCreated: true });
    fs.rmSync(deleted);
    assert.deepStrictEqual(await thumbnailStates([deleted], paths),
      [{ attemptFinished: false, cacheAvailable: false, thumbnailFilePath: paths.thumbnailFilePath(deleted) }]);
  });
});
