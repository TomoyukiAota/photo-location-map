import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import exifr from 'exifr';
import { managedExifr } from '../../../electron-util/managed-exifr.js';
import { repositoryPath } from '../../test-util/repository.js';

describe('managed exifr file readers', () => {
  let directory: string;
  let opened: Array<{ handle: fs.promises.FileHandle; closed: boolean; bytesRead: number }>;
  let originalOpen: typeof fs.promises.open;
  let closeFailure: Error;
  let ioFailure: { operation: 'stat' | 'read'; error: Error };

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-exifr-'));
    opened = [];
    closeFailure = undefined;
    ioFailure = undefined;
    originalOpen = fs.promises.open;
    fs.promises.open = async (...args: Parameters<typeof fs.promises.open>) => {
      const handle = await originalOpen(...args);
      const entry = { handle, closed: false, bytesRead: 0 };
      opened.push(entry);
      const close = handle.close.bind(handle);
      const read = handle.read.bind(handle);
      const stat = handle.stat.bind(handle);
      handle.stat = async (...statArgs) => {
        if (ioFailure?.operation === 'stat') throw ioFailure.error;
        return stat(...statArgs);
      };
      handle.close = async () => {
        await close();
        entry.closed = true;
        if (closeFailure) throw closeFailure;
      };
      handle.read = (async (...readArgs: any[]) => {
        if (ioFailure?.operation === 'read') throw ioFailure.error;
        const result = await read(...readArgs);
        entry.bytesRead += result.bytesRead;
        return result;
      }) as typeof handle.read;
      return handle;
    };
  });

  afterEach(async () => {
    fs.promises.open = originalOpen;
    for (const entry of opened) {
      if (!entry.closed) await entry.handle.close();
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('closes a thumbnail reader when the image has no TIFF segment, without reading the whole image', async () => {
    const filename = path.join(directory, 'no-exif.png');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6XmcAAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(filename, Buffer.concat([png, Buffer.alloc(8 * 1024 * 1024)]));

    assert.equal(await managedExifr.thumbnail(filename), undefined);
    assert.equal(opened.length, 1);
    assert.equal(opened[0].closed, true);
    assert(opened[0].bytesRead < fs.statSync(filename).size);
  });

  it('closes a malformed image reader and preserves the parse failure', async () => {
    const filename = path.join(directory, 'malformed.jpg');
    fs.writeFileSync(filename, Buffer.from([0xff]));

    await assert.rejects(managedExifr.parse(filename), RangeError);
    assert.equal(opened.length, 1);
    assert.equal(opened[0].closed, true);
  });

  for (const operation of ['stat', 'read'] as const) {
    it(`closes an opened reader when initial ${operation} fails, preserving that error if cleanup also fails`, async () => {
      const filename = path.join(directory, 'initial-read-failure.jpg');
      fs.writeFileSync(filename, Buffer.from([0xff]));
      ioFailure = { operation, error: new Error(`Injected ${operation} failure`) };
      closeFailure = new Error('Cleanup failed');

      await assert.rejects(managedExifr.parse(filename), error => error === ioFailure.error);
      assert.equal(opened.length, 1);
      assert.equal(opened[0].closed, true);
    });
  }

  it('keeps buffers, data URLs, and long base64 strings on their original readers', async () => {
    const filename = repositoryPath('test', 'test-resources', 'actual-photos', 'Kobe', 'IMG_4676.JPG');
    const input = fs.readFileSync(filename);
    const options = { pick: ['Make', 'Orientation'] };
    const expected = await exifr.parse(input, options);
    const base64 = input.toString('base64');
    assert(base64.length > 10000);

    for (const data of [input, `data:image/jpeg;base64,${base64}`, base64]) {
      assert.deepEqual(await managedExifr.parse(data, options), expected);
    }
    assert.equal(opened.length, 0);
  });

  it('preserves the original metadata and embedded thumbnail bytes', async () => {
    const filename = repositoryPath('test', 'test-resources', 'actual-photos', 'Kobe', 'IMG_4676.JPG');
    const input = fs.readFileSync(filename);
    const options = { translateValues: false, pick: ['Make', 'Orientation', 'GPSLatitude', 'GPSLongitude'] };

    assert.deepEqual(await managedExifr.parse(filename, options), await exifr.parse(input, options));
    assert.deepEqual(await managedExifr.thumbnail(filename), await exifr.thumbnail(input));
    assert.equal(opened.length, 2);
    assert(opened.every(entry => entry.closed));
  });

  it('keeps the parse error when cleanup also fails', async () => {
    const filename = path.join(directory, 'malformed.jpg');
    fs.writeFileSync(filename, Buffer.from([0xff]));
    closeFailure = new Error('Cleanup failed');

    await assert.rejects(managedExifr.parse(filename), RangeError);
    assert.equal(opened[0].closed, true);
  });
});
