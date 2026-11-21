import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { decodeEmbeddedThumbnailToJpeg } from '../../../src-main/heif/embedded-thumbnail-decoder.js';
import { decodeToJpeg } from '../../../src-main/heif/embedded-thumbnail-worker.js';
import { readEmbeddedThumbnail, readWholeImage } from '../../../src-main/heif/heif-file.js';
import { cleanApertureOf, HeifFormatError } from '../../../src-main/heif/heif-meta.js';
import { codecStringOf } from '../../../src-main/heif/hevc-configuration.js';
import { transformRgba } from '../../../src-main/heif/transform-rgba.js';
import type { HeifEmbeddedThumbnail } from '../../../src-shared/heif/heif-images.js';
import { repositoryPath } from '../../test-util/repository.js';

// The fixtures: demo.heic, made with macOS's sips, which writes no thumbnail item, and demo-with-thumbnail.heic, the
// same photo at half its size made with ImageIO, which writes one as an iPhone does (test/e2e/fixtures/README.md).
const withoutThumbnail = repositoryPath('test', 'e2e', 'fixtures', 'demo.heic');
const withThumbnail = repositoryPath('test', 'e2e', 'fixtures', 'demo-with-thumbnail.heic');

type HevcThumbnail = Extract<HeifEmbeddedThumbnail, { kind: 'hevc' }>;

/** The width and height in a JPEG's start of frame. */
function jpegSize(jpeg: Uint8Array): { width: number, height: number } {
  const bytes = Buffer.from(jpeg);
  assert.deepStrictEqual([...bytes.subarray(0, 2)], [0xff, 0xd8], 'A JPEG starts with SOI.');
  for (let position = 2; position + 9 < bytes.length;) {
    const marker = bytes[position + 1];
    if (marker >= 0xc0 && marker <= 0xc2)
      return { height: bytes.readUInt16BE(position + 5), width: bytes.readUInt16BE(position + 7) };
    position += 2 + bytes.readUInt16BE(position + 2);
  }
  throw new Error('No start of frame.');
}

// A HEIF file as a test needs it: one HEVC picture as the primary image and as its thumbnail item, which declares a
// size and a rotation of its own, with `meta` before or after `mdat`.
function box(type: string, ...parts: Buffer[]): Buffer {
  const body = Buffer.concat(parts);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
}
const fullBox = (type: string, version: number, ...parts: Buffer[]) => box(type, Buffer.from([version, 0, 0, 0]), ...parts);
const u16 = (value: number) => { const b = Buffer.alloc(2); b.writeUInt16BE(value); return b; };
const u32 = (value: number) => { const b = Buffer.alloc(4); b.writeUInt32BE(value); return b; };

function heifFile(thumbnail: HevcThumbnail, declared: { width: number, height: number, rotation: number }, metaLast: boolean): Buffer {
  const ftyp = box('ftyp', Buffer.from('heic'), u32(0), Buffer.from('mif1heic'));
  const infe = (id: number) => fullBox('infe', 2, u16(id), u16(0), Buffer.from('hvc1'), Buffer.from([0]));
  const hvcC = box('hvcC', Buffer.from(thumbnail.hevc.description));
  const ipco = box('ipco', hvcC,
    fullBox('ispe', 0, u32(thumbnail.hevc.codedWidth), u32(thumbnail.hevc.codedHeight)),
    fullBox('ispe', 0, u32(declared.width), u32(declared.height)),
    box('irot', Buffer.from([declared.rotation / 90])));
  const ipma = fullBox('ipma', 0, u32(2), u16(1), Buffer.from([2, 0x81, 2]), u16(2), Buffer.from([3, 0x81, 3, 0x84]));
  const iref = fullBox('iref', 0, box('thmb', u16(2), u16(1), u16(1)));
  const data = Buffer.from(thumbnail.data);
  const iloc = (offset: number) => fullBox('iloc', 0, Buffer.from([0x44, 0x00]), u16(2),
    u16(1), u16(0), u16(1), u32(offset), u32(data.length),
    u16(2), u16(0), u16(1), u32(offset), u32(data.length));
  const meta = (offset: number) => fullBox('meta', 0,
    fullBox('hdlr', 0, u32(0), Buffer.from('pict'), Buffer.alloc(12), Buffer.from([0])),
    fullBox('pitm', 0, u16(1)), iloc(offset), fullBox('iinf', 0, u16(2), infe(1), infe(2)), iref, box('iprp', ipco, ipma));
  const mdat = box('mdat', data);
  if (metaLast)
    return Buffer.concat([ftyp, mdat, meta(ftyp.length + 8)]);
  return Buffer.concat([ftyp, meta(ftyp.length + meta(0).length + 8), mdat]);
}

describe('HEIF files (in main process)', () => {
  let folder: string;
  let thumbnail: HevcThumbnail;

  before(async () => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-heif-'));
    thumbnail = await readEmbeddedThumbnail(withThumbnail) as HevcThumbnail;
  });

  after(() => fs.rmSync(folder, { recursive: true, force: true }));

  it('reads the thumbnail item of an iPhone\'s photo, turned as the photo is', () => {
    assert.strictEqual(thumbnail.kind, 'hevc');
    assert.deepStrictEqual({ ...thumbnail.hevc, description: thumbnail.hevc.description.length },
      { codec: 'hvc1.3.E.L60.B0', description: thumbnail.hevc.description.length, codedWidth: 320, codedHeight: 240 });
    assert.deepStrictEqual(thumbnail.crop, { x: 0, y: 0, width: 320, height: 240 });
    assert.strictEqual(thumbnail.rotation, 270);
    assert.strictEqual(thumbnail.data.length, 11432);
    // Length-prefixed NAL units: the first is 4 bytes of length and fits in the item.
    assert(Buffer.from(thumbnail.data).readUInt32BE(0) + 4 <= thumbnail.data.length);
  });

  it('gives no thumbnail item for a photo without one', async () => {
    assert.strictEqual(await readEmbeddedThumbnail(withoutThumbnail), null);
  });

  it('reads the tiles of the whole image', async () => {
    const half = await readWholeImage(withThumbnail);
    assert.deepStrictEqual({ rows: half.rows, columns: half.columns, tileWidth: half.tileWidth, tileHeight: half.tileHeight,
      tiles: half.tiles.length, crop: half.crop, rotation: half.rotation, codedWidth: half.hevc.codedWidth },
    { rows: 3, columns: 4, tileWidth: 512, tileHeight: 512, tiles: 12, crop: { x: 0, y: 0, width: 2016, height: 1512 },
      rotation: 270, codedWidth: 512 });
    const whole = await readWholeImage(withoutThumbnail);
    assert.deepStrictEqual([whole.rows, whole.columns, whole.tiles.length, whole.crop.width, whole.crop.height, whole.rotation],
      [6, 8, 48, 4032, 3024, 270]);
    // Each tile is a copy of its own, so that IPC copies only it.
    assert(whole.tiles.every(tile => tile.byteOffset === 0 && tile.buffer.byteLength === tile.length));
  });

  it('finds meta after mdat, and declares the size that the file declares, smaller than the coded picture', async () => {
    const file = path.join(folder, 'meta-last.heic');
    fs.writeFileSync(file, heifFile(thumbnail, { width: 320, height: 200, rotation: 90 }, true));
    const found = await readEmbeddedThumbnail(file) as HevcThumbnail;
    assert.deepStrictEqual(found.crop, { x: 0, y: 0, width: 320, height: 200 });
    assert.strictEqual(found.rotation, 90);
    assert.deepStrictEqual([found.hevc.codedWidth, found.hevc.codedHeight], [320, 240]);
    assert.deepStrictEqual(Buffer.from(found.data), Buffer.from(thumbnail.data));
    const whole = await readWholeImage(file);
    assert.deepStrictEqual([whole.rows, whole.columns, whole.crop.width, whole.crop.height], [1, 1, 320, 240]);
  });

  it('decodes a thumbnail item with libheif, cropped and turned', async () => {
    assert.deepStrictEqual(jpegSize(await decodeToJpeg(thumbnail)), { width: 240, height: 320 });
    // As Canon's and Sony's thumbnails: a picture larger than the declared size, of which the image is the top-left.
    const file = path.join(folder, 'larger-picture.heic');
    fs.writeFileSync(file, heifFile(thumbnail, { width: 320, height: 200, rotation: 0 }, false));
    const larger = await readEmbeddedThumbnail(file) as HevcThumbnail;
    assert.deepStrictEqual(jpegSize(await decodeToJpeg(larger)), { width: 320, height: 200 });
  });

  it('decodes thumbnail items in a utility process', async () => {
    const jpegs = await Promise.all([decodeEmbeddedThumbnailToJpeg(thumbnail), decodeEmbeddedThumbnailToJpeg(thumbnail)]);
    for (const jpeg of jpegs)
      assert.deepStrictEqual(jpegSize(jpeg), { width: 240, height: 320 });
  });

  it('refuses a file that is not HEIF, and one cut short', async () => {
    await assert.rejects(readEmbeddedThumbnail(repositoryPath('test', 'test-resources', 'unsupported-files', 'Invalid Photo.JPG')),
      HeifFormatError);
    const cut = path.join(folder, 'cut.heic');
    fs.writeFileSync(cut, fs.readFileSync(withThumbnail).subarray(0, 2000));
    await assert.rejects(readEmbeddedThumbnail(cut), HeifFormatError);
    await assert.rejects(readWholeImage(cut), HeifFormatError);
  });
});

describe('HEVC configurations (in main process)', () => {
  it('gives the codec string of WebCodecs', () => {
    const record = Buffer.alloc(23);
    record[1] = 0b0010_0001;                 // profile space 0, tier High, profile 1 (Main)
    record.writeUInt32BE(0x6000_0000, 2);    // compatible with profiles 1 and 2
    record[6] = 0x90;                        // the first constraint byte
    record[12] = 120;                        // level 4
    assert.strictEqual(codecStringOf(record), 'hvc1.1.6.H120.90');
  });
});

describe('Transformations of decoded pictures (in main process)', () => {
  // 3x2, each pixel's red is its letter: a b c / d e f.
  const picture = { width: 3, height: 2, data: Uint8Array.from('abcdef'.split('').flatMap(c => [c.charCodeAt(0), 0, 0, 255])) };
  const letters = (image: { width: number, height: number, data: ArrayLike<number> }) =>
    Array.from({ length: image.height }, (_, y) => Array.from({ length: image.width },
      (__, x) => String.fromCharCode(image.data[(y * image.width + x) * 4])).join(''));
  const all = { x: 0, y: 0, width: 3, height: 2 };

  it('turns anti-clockwise, then mirrors', () => {
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 0 })), ['abc', 'def']);
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 90 })), ['cf', 'be', 'ad']);
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 180 })), ['fed', 'cba']);
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 270 })), ['da', 'eb', 'fc']);
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 0, mirror: 0 })), ['cba', 'fed']);
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 0, mirror: 1 })), ['def', 'abc']);
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: all, rotation: 90, mirror: 0 })), ['fc', 'eb', 'da']);
  });

  it('crops first', () => {
    assert.deepStrictEqual(letters(transformRgba(picture, { crop: { x: 1, y: 0, width: 2, height: 2 }, rotation: 90 })),
      ['cf', 'be']);
    assert.throws(() => transformRgba(picture, { crop: { x: 2, y: 0, width: 2, height: 2 }, rotation: 0 }));
  });

  it('finds the clean aperture around the centre', () => {
    // 100x80 cropped to 50x40 at the centre, then moved 5 to the right.
    assert.deepStrictEqual(cleanApertureOf([50, 1, 40, 1, 5, 1, 0, 1], 100, 80), { x: 30, y: 20, width: 50, height: 40 });
  });
});
