/**
 * Whether a JPEG was cut short: it starts as a JPEG does, with SOI, but has no EOI marker, with which every JPEG ends.
 * Bytes after EOI, as some writers pad a thumbnail with, are allowed.
 * TL;DR: For the thumbnail in a photo's EXIF data, which an img element loads and draws as far as it could decode it,
 * the other rows empty, without an error that the viewers could take it for one that does not decode by
 * (docs/tasks/20261125_undecodable-exif-thumbnails/STATUS.md).
 * Details:
 * - An app that rewrites a photo's EXIF data with the thumbnail's length too short leaves such a thumbnail: the reader
 *   gives that many bytes of it (exifr, in src-main/exif/read-exif.ts).
 * - EOI is looked for in the data of the scans only, from the end. The segments before the first scan are read by
 *   their lengths, as their content can hold 0xFF 0xD9, as a comment or a table can. Inside a scan's data, a 0xFF is
 *   followed by a zero or a restart marker, never by 0xD9. A whole thumbnail ends with EOI, or with a few bytes after
 *   it, so that a folder of photos costs the few segments of each and a comparison or two.
 */
export function isCutShort(jpeg: Uint8Array): boolean {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8)
    return false;
  const scanData = firstScanData(jpeg);
  if (scanData === 'cut')
    return true;
  if (scanData === undefined)
    return false;
  for (let offset = jpeg.length - 2; offset >= scanData; offset--) {
    if (jpeg[offset] === 0xff && jpeg[offset + 1] === 0xd9)
      return false;
  }
  return true;
}

/** Whether a marker stands alone, without a segment: TEM, RST0 to RST7 and SOI. */
function standsAlone(code: number): boolean {
  return code === 0x01 || (code >= 0xd0 && code <= 0xd8);
}

/**
 * Where the data of the JPEG's first scan start, after the segments before it, which are read by their lengths:
 * 'cut' where the JPEG ends before them; undefined where its segments are not as a JPEG has them, or where it ends,
 * with EOI, before any scan. Those are left to orientedJpeg() and the img element, as before.
 */
function firstScanData(jpeg: Uint8Array): number | 'cut' | undefined {
  let offset = 2;
  for (;;) {
    if (offset >= jpeg.length)
      return 'cut';
    if (jpeg[offset] !== 0xff)
      return undefined;
    // A marker: 0xFF and its code, after any bytes of 0xFF that fill the room before it.
    while (jpeg[offset + 1] === 0xff)
      offset++;
    const code = jpeg[offset + 1];
    if (code === undefined)
      return 'cut';
    if (code === 0x00 || code === 0xd9)
      return undefined;
    if (standsAlone(code)) {
      offset += 2;
      continue;
    }

    // A segment: its length, which counts its own two bytes, and its content.
    if (offset + 4 > jpeg.length)
      return 'cut';
    const length = (jpeg[offset + 2] << 8) | jpeg[offset + 3];
    if (length < 2)
      return undefined;
    const end = offset + 2 + length;
    if (end > jpeg.length)
      return 'cut';
    // SOS: the scan's header, after which its data start.
    if (code === 0xda)
      return end;
    offset = end;
  }
}
