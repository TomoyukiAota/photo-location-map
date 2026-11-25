import { isCutShort } from './cut-short-jpeg.js';

// The segments of a JPEG, as far as isCutShort() reads them; not an image that anything could decode. That a photo
// whose EXIF thumbnail is cut short has none is tested with a real JPEG in
// test/src/app/shared/exif-fetcher.spec.em.renderer.ts.
const soi = [0xff, 0xd8];
const quantizationTable = [0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02];
/** The scan's header, then its data, with a 0xFF that a zero follows and a restart marker. */
const scan = [0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56];
const eoi = [0xff, 0xd9];

const jpegOf = (...segments: number[][]) => Uint8Array.from(segments.flat());

describe('isCutShort', () => {
  it('is false for a JPEG that ends with EOI, or has bytes after it, as some writers pad a thumbnail', () => {
    expect(isCutShort(jpegOf(soi, quantizationTable, scan, eoi))).toBe(false);
    expect(isCutShort(jpegOf(soi, quantizationTable, scan, eoi, [0x00, 0x00, 0x00, 0x00]))).toBe(false);
    expect(isCutShort(jpegOf(soi, quantizationTable, scan, eoi, [0x12, 0xff, 0xff]))).toBe(false);
  });

  it('is true for a JPEG without its end: cut in its scan\'s data, in its scan\'s header or right after SOI', () => {
    expect(isCutShort(jpegOf(soi, quantizationTable, scan))).toBe(true);
    expect(isCutShort(jpegOf(soi, quantizationTable, scan.slice(0, 5)))).toBe(true);
    expect(isCutShort(jpegOf(soi))).toBe(true);
  });

  it('is false for what is not a JPEG, which is turned on a canvas instead', () => {
    expect(isCutShort(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(false);
    expect(isCutShort(new Uint8Array(0))).toBe(false);
  });
});
