import { orientedJpeg } from './oriented-jpeg.js';

// The segments of a JPEG, as far as orientedJpeg() reads them; not an image that anything could decode. That the page
// shows a JPEG turned so is tested with real JPEGs in test/src/app/shared/oriented-jpeg.spec.em.renderer.ts.
const soi = [0xff, 0xd8];
const jfif = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
const quantizationTable = [0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02];
/** A frame header, of one component, of the size given. */
const frameHeader = ({ marker = 0xc0, precision = 8, width = 160, height = 120 } = {}) =>
  [0xff, marker, 0x00, 0x0b, precision, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x01, 0x01, 0x11, 0x00];
/** The scan's header, its data with a 0xFF that a zero follows, and the end of the image. */
const scanToEnd = [0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0xff, 0x00, 0x34, 0xff, 0xd9];
/** An APP1 segment of EXIF of the JPEG's own, which says an orientation of 3. */
const ownExif = [0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
  0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
/** An APP1 segment of XMP, which the page does not take an orientation from. */
const xmp = [0xff, 0xe1, 0x00, 0x08, 0x68, 0x74, 0x74, 0x70, 0x3a, 0x2f];

/** The APP1 segment of EXIF that holds only an Orientation of `orientation`, as orientedJpeg() writes it. */
const orientationSegment = (orientation: number) => [
  0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
  0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

const jpegOf = (...segments: number[][]) => Uint8Array.from(segments.flat());
/** The bytes of the JPEG that orientedJpeg() gives, joined. */
const bytesOf = (parts: readonly Uint8Array[]) => parts.flatMap(part => Array.from(part));

describe('orientedJpeg', () => {
  const thumbnail = jpegOf(soi, jfif, quantizationTable, frameHeader(), scanToEnd);

  it('puts the orientation in an EXIF segment right after SOI, and gives the size as the JPEG is shown', () => {
    for (const orientation of [2, 3, 4, 5, 6, 7, 8]) {
      const oriented = orientedJpeg(thumbnail, orientation);
      expect(bytesOf(oriented.parts)).toEqual([...soi, ...orientationSegment(orientation), ...thumbnail.slice(2)]);
      expect(oriented.dimensions).toEqual(orientation > 4 ? { width: 120, height: 160 } : { width: 160, height: 120 });
    }
  });

  it('leaves the JPEG as it is for orientation 1, and for a value that EXIF does not have', () => {
    for (const orientation of [1, 0, 9, 6.5]) {
      const oriented = orientedJpeg(thumbnail, orientation);
      expect(bytesOf(oriented.parts)).toEqual(Array.from(thumbnail));
      expect(oriented.dimensions.width).toBe(160);
    }
  });

  it('leaves out the EXIF segments of the JPEG\'s own, so that only the photo\'s orientation turns it, and keeps the rest', () => {
    const withOwnExif = jpegOf(soi, ownExif, jfif, quantizationTable, ownExif, xmp, frameHeader(), scanToEnd);

    expect(bytesOf(orientedJpeg(withOwnExif, 6).parts))
      .toEqual([...soi, ...orientationSegment(6), ...jfif, ...quantizationTable, ...xmp, ...frameHeader(), ...scanToEnd]);
    expect(bytesOf(orientedJpeg(withOwnExif, 1).parts))
      .toEqual([...soi, ...jfif, ...quantizationTable, ...xmp, ...frameHeader(), ...scanToEnd]);
  });

  it('reads the frame headers of baseline, extended and progressive JPEGs, and markers after bytes that fill room', () => {
    for (const marker of [0xc0, 0xc1, 0xc2])
      expect(orientedJpeg(jpegOf(soi, frameHeader({ marker, width: 4000, height: 3000 }), scanToEnd), 1).dimensions)
        .toEqual({ width: 4000, height: 3000 });
    const filled = jpegOf(soi, [0xff, 0xff], jfif, [0xff], ownExif, [0xff, 0xff], frameHeader(), scanToEnd);
    expect(bytesOf(orientedJpeg(filled, 8).parts))
      .toEqual([...soi, ...orientationSegment(8), 0xff, 0xff, ...jfif, ...[0xff, 0xff], ...frameHeader(), ...scanToEnd]);
  });

  it('is null for what is turned on a canvas instead: what is not a JPEG whose frame the page decodes', () => {
    const notTaken = {
      'a PNG': Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      'nothing': new Uint8Array(0),
      'SOI alone': jpegOf(soi),
      'a frame of arithmetic coding': jpegOf(soi, frameHeader({ marker: 0xc9 }), scanToEnd),
      'a lossless frame': jpegOf(soi, frameHeader({ marker: 0xc3 }), scanToEnd),
      'a frame of 12 bits a sample': jpegOf(soi, frameHeader({ precision: 12 }), scanToEnd),
      'a frame whose height comes after the scan': jpegOf(soi, frameHeader({ height: 0 }), scanToEnd),
      'two frame headers': jpegOf(soi, frameHeader(), frameHeader(), scanToEnd),
      'no frame header before the scan': jpegOf(soi, jfif, scanToEnd, frameHeader()),
      'a segment that runs past the end': jpegOf(soi, jfif, frameHeader()).slice(0, -3),
      'no marker after a segment': jpegOf(soi, jfif, [0x00], frameHeader(), scanToEnd),
      'the end before the scan': jpegOf(soi, jfif, [0xff, 0xd9]),
    };
    for (const [what, bytes] of Object.entries(notTaken))
      expect(orientedJpeg(bytes, 6), what).toBeNull();
  });
});
