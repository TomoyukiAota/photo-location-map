import { getRotatedSize } from './image-rotation.js';
import { Dimensions } from './model/dimensions.model.js';

/** A JPEG that an img element shows turned as an EXIF orientation says, with its size as it is shown. */
export interface OrientedJpeg {
  /** The JPEG's bytes, in parts, for a Blob, whose constructor takes an array that is not read-only. */
  readonly parts: Uint8Array[];
  readonly dimensions: Dimensions;
}

/**
 * The frame headers that the page decodes: SOF0, SOF1 and SOF2, baseline, extended and progressive, of Huffman coding.
 * The others are of arithmetic coding, lossless or hierarchical.
 */
const decodedFrameMarkers: ReadonlySet<number> = new Set([0xc0, 0xc1, 0xc2]);

/** Whether a marker starts a frame header: 0xC0 to 0xCF, but DHT (0xC4), JPG (0xC8) and DAC (0xCC). */
function isFrameHeader(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

/** Whether a marker stands alone, without a segment: TEM, RST0 to RST7, SOI and EOI. */
function standsAlone(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);
}

/** "Exif" and two zeros, with which the content of an APP1 segment of EXIF starts. */
const exifIdentifier = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];

/** Whether the segment of `length` whose marker's code is at `codeOffset` is an APP1 segment of EXIF. */
function isExifSegment(jpeg: Uint8Array, codeOffset: number, length: number): boolean {
  return jpeg[codeOffset] === 0xe1 && length >= 2 + exifIdentifier.length
    && exifIdentifier.every((byte, index) => jpeg[codeOffset + 3 + index] === byte);
}

/** An APP1 segment of EXIF that holds one tag, the Orientation, in TIFF's structure in big-endian order. */
function orientationSegment(orientation: number): Uint8Array {
  return new Uint8Array([
    0xff, 0xe1, 0x00, 0x22,                          // APP1, of 34 bytes after its marker.
    ...exifIdentifier,
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,  // TIFF, big-endian ("MM"), its first IFD 8 bytes from here.
    0x00, 0x01,                                      // The IFD's one entry:
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01,  //   Orientation (0x0112), a SHORT, one of them,
    0x00, orientation, 0x00, 0x00,                   //   which is `orientation`;
    0x00, 0x00, 0x00, 0x00,                          // and no IFD after it.
  ]);
}

/**
 * The JPEG, to be shown turned as `orientation` says, as EXIF's Orientation does (1 to 8): with an APP1 segment of
 * EXIF that holds only that orientation, right after its SOI, and without any EXIF segment of its own. Null for what is
 * not a JPEG whose frame the page decodes: of 8 bits a sample, with a frame header of SOF0, SOF1 or SOF2 before its
 * scan.
 * TL;DR: An img element turns a JPEG as the JPEG's EXIF says (CSS's `image-orientation: from-image`, the default, which
 * the application's styles leave as it is), as a canvas's drawImage() and createImageBitmap() do, with which the
 * search for faces decodes a thumbnail. So the thumbnail that a camera writes into a photo's EXIF data is shown turned
 * as the photo is, with no canvas (createThumbnail() in exif-fetcher/using-exifr/fetch-exif-using-exifr.ts).
 * Details:
 * - Only the segments before the scan are read: the frame header, for the size, and the EXIF segments. Those of the
 *   JPEG's own, which a camera's thumbnail seldom has, are left out, so that only the photo's orientation turns it.
 * - Orientation 1, or a value that EXIF does not have, gets no segment: the JPEG is shown as it is, as the canvas drew
 *   it.
 */
export function orientedJpeg(jpeg: Uint8Array, orientation: number): OrientedJpeg | null {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8)
    return null;

  let size: { width: number; height: number } | undefined;
  /** The bytes between SOI and the scan, without the EXIF segments. */
  const kept: Uint8Array[] = [];
  let keptFrom = 2;
  let offset = 2;
  for (;;) {
    // A marker: 0xFF and its code, after any bytes of 0xFF that fill the room before it.
    const segmentStart = offset;
    if (jpeg[offset] !== 0xff)
      return null;
    while (jpeg[offset + 1] === 0xff)
      offset++;
    const code = jpeg[offset + 1];
    // SOS: the scan, which runs to a marker of its own data, and the rest of the file, kept as they are.
    if (code === 0xda)
      break;
    if (code === undefined || code === 0x00 || standsAlone(code))
      return null;

    // A segment: its length, which counts its own two bytes, and its content.
    const length = (jpeg[offset + 2] << 8) | jpeg[offset + 3];
    const end = offset + 2 + length;
    if (!(length >= 2) || end > jpeg.length)
      return null;
    if (isFrameHeader(code)) {
      const precision = jpeg[offset + 4];
      const height = (jpeg[offset + 5] << 8) | jpeg[offset + 6];
      const width = (jpeg[offset + 7] << 8) | jpeg[offset + 8];
      // A second frame header, as a hierarchical JPEG has, or a height that a DNL segment after the scan gives.
      if (size || !decodedFrameMarkers.has(code) || length < 8 || precision !== 8 || !width || !height)
        return null;
      size = { width, height };
    }
    if (isExifSegment(jpeg, offset + 1, length)) {
      if (segmentStart > keptFrom)
        kept.push(jpeg.subarray(keptFrom, segmentStart));
      keptFrom = end;
    }
    offset = end;
  }
  if (!size)
    return null;

  const turned = Number.isInteger(orientation) && orientation >= 2 && orientation <= 8;
  const parts = [jpeg.subarray(0, 2)];
  if (turned)
    parts.push(orientationSegment(orientation));
  parts.push(...kept, jpeg.subarray(keptFrom));
  const shown = turned ? getRotatedSize(size.width, size.height, orientation) : size;
  return { parts, dimensions: new Dimensions(shown.width, shown.height) };
}
