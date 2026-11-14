import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readExif } from '../../../src-main/exif/read-exif.js';
import { repositoryPath } from '../../test-util/repository.js';

const resources = repositoryPath('test', 'test-resources');

describe('readExif (in main process)', () => {
  let directory: string;
  beforeEach(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-read-exif-')); });
  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  it('gives the fields the app uses and the embedded thumbnail of a JPEG, as plain data', async () => {
    const result = await readExif(path.join(resources, 'actual-photos', 'Kobe', 'IMG_4676.JPG'));
    assert.strictEqual(result.parse, 'ok');
    if (result.parse !== 'ok') return;
    assert.deepStrictEqual(Object.keys(result.output).sort(),
      ['DateTimeOriginal', 'ExifImageHeight', 'ExifImageWidth', 'Make', 'Orientation', 'latitude', 'longitude']);
    assert(result.output.DateTimeOriginal instanceof Date);
    assert.strictEqual(result.output.ExifImageWidth, 4032);
    assert.strictEqual(result.output.Orientation, 1);
    assert(Math.abs(result.output.latitude - 34.688075) < 1e-6);
    assert(result.thumbnail instanceof Uint8Array && result.thumbnail.length > 1000);
    assert.deepStrictEqual([...result.thumbnail.subarray(0, 2)], [0xff, 0xd8], 'The thumbnail is a JPEG.');
    assert.strictEqual(result.thumbnailError, undefined);
  });

  it('gives the rotation of a HEIC', async () => {
    const result = await readExif(repositoryPath('test', 'e2e', 'fixtures', 'demo.heic'));
    assert.strictEqual(result.parse, 'ok');
    if (result.parse === 'ok') assert.strictEqual(result.output.Orientation, 6);
  });

  it('reports a file that cannot be read as failed, with why', async () => {
    const result = await readExif(path.join(directory, 'missing.JPG'));
    assert.strictEqual(result.parse, 'failed');
    if (result.parse === 'failed') assert.match(result.error, /ENOENT|no such file/i);
  });

  it('reports a file without EXIF as empty', async () => {
    const file = path.join(directory, 'plain.JPG');
    fs.writeFileSync(file, Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    const result = await readExif(file);
    assert.ok(result.parse === 'empty' || result.parse === 'failed', `unexpected ${JSON.stringify(result)}`);
  });
});
