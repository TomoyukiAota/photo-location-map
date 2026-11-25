/** Whether a marker of a JPEG starts a frame header: 0xC0 to 0xCF, but DHT (0xC4), JPG (0xC8) and DAC (0xCC). */
export function isFrameHeader(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

/** Whether a marker of a JPEG stands alone, without a segment: TEM, RST0 to RST7, SOI and EOI. */
export function standsAlone(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);
}

/** The size of a JPEG's frame: that of its pixels, as they are stored, before an EXIF orientation turns them. */
export interface FrameSize {
  readonly width: number;
  readonly height: number;
}

/** Reads `length` bytes of a file from `offset`: undefined where the file has fewer. */
export type ReadBytes = (offset: number, length: number) => Promise<Uint8Array | undefined>;

/**
 * The size in a JPEG's frame header, read through `read`. Null for what is not a JPEG, for one whose segments end, or
 * are not segments, before its frame header, and for a frame header without a height, which a DNL segment after the
 * scan would give.
 * TL;DR: The size of the pixels for certain, which a photo's EXIF data give only as far as the app that last wrote
 * them kept it (isExifThumbnailOnItsSide in src/app/shared/exif-thumbnail-on-its-side.ts).
 * Details: Of each segment before the frame header, only its marker and its length are read, 4 bytes, and of the
 * frame header its size: the contents are skipped, the EXIF segment's, which is the largest, among them.
 */
export async function jpegFrameSize(read: ReadBytes): Promise<FrameSize | null> {
  const start = await read(0, 2);
  if (!start || start[0] !== 0xff || start[1] !== 0xd8)
    return null;

  let offset = 2;
  for (;;) {
    const header = await read(offset, 4);
    if (!header || header[0] !== 0xff)
      return null;
    // A byte of 0xFF that fills the room before a marker.
    if (header[1] === 0xff) {
      offset++;
      continue;
    }
    const code = header[1];
    // SOS, the scan, which comes after the frame header.
    if (code === 0xda || code === 0x00 || standsAlone(code))
      return null;
    const length = (header[2] << 8) | header[3];
    if (length < 2)
      return null;
    if (isFrameHeader(code)) {
      // The sample precision, then the height and the width.
      const frame = length >= 7 ? await read(offset + 4, 5) : undefined;
      if (!frame)
        return null;
      const height = (frame[1] << 8) | frame[2];
      const width = (frame[3] << 8) | frame[4];
      return width && height ? { width, height } : null;
    }
    offset += 2 + length;
  }
}
