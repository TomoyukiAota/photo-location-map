import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { removeEmptyCacheDirectories } from '../../../src-shared/thumbnail/cache/remove-empty-cache-directories.js';

describe('removeEmptyCacheDirectories', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-empty-cache-'));
  });

  afterEach(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));

  it('removes empty descendants and the cache root, including OS metadata files', () => {
    const cache = path.join(temporaryDirectory, 'cache');
    fs.mkdirSync(path.join(cache, 'nested', 'empty'), { recursive: true });
    fs.writeFileSync(path.join(cache, '.ds_store'), 'metadata');
    fs.writeFileSync(path.join(cache, 'nested', 'THUMBS.DB'), 'metadata');
    removeEmptyCacheDirectories(cache);
    assert.equal(fs.existsSync(cache), false);
    assert.equal(fs.existsSync(temporaryDirectory), true);
  });

  it('keeps thumbnails and logs while removing empty sibling directories', () => {
    const cache = path.join(temporaryDirectory, 'cache');
    fs.mkdirSync(path.join(cache, 'empty'), { recursive: true });
    fs.writeFileSync(path.join(cache, 'photo.plm.jpg'), 'thumbnail');
    fs.writeFileSync(path.join(cache, 'photo.log.json'), '{}');
    fs.writeFileSync(path.join(cache, '.DS_Store'), 'metadata');
    removeEmptyCacheDirectories(cache);
    assert.deepEqual(fs.readdirSync(cache).sort(), ['.DS_Store', 'photo.log.json', 'photo.plm.jpg']);
  });

  it('does not traverse directory links outside the cache', () => {
    const cache = path.join(temporaryDirectory, 'cache');
    const outside = path.join(temporaryDirectory, 'outside');
    fs.mkdirSync(cache);
    fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(cache, 'link'), process.platform === 'win32' ? 'junction' : 'dir');
    removeEmptyCacheDirectories(cache);
    assert.equal(fs.existsSync(outside), true);
    assert.equal(fs.lstatSync(path.join(cache, 'link')).isSymbolicLink(), true);
  });

  it('accepts an already absent cache directory', () => {
    assert.doesNotThrow(() => removeEmptyCacheDirectories(path.join(temporaryDirectory, 'absent')));
  });
});
