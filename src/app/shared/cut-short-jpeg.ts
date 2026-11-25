/**
 * Whether a JPEG was cut short: it starts as a JPEG does, with SOI, but has no EOI marker, with which every JPEG ends.
 * Bytes after EOI, as some writers pad a thumbnail with, are allowed.
 * TL;DR: For the thumbnail in a photo's EXIF data, which an img element loads and draws as far as it could decode it,
 * the other rows empty, without an error that the viewers could take it for one that does not decode by
 * (docs/tasks/20261125_undecodable-exif-thumbnails/STATUS.md).
 * Details:
 * - An app that rewrites a photo's EXIF data with the thumbnail's length too short leaves such a thumbnail: the reader
 *   gives that many bytes of it (exifr, in src-main/exif/read-exif.ts).
 * - Looked for from the end: a whole thumbnail ends with EOI, or with a few bytes after it, so that a folder of photos
 *   costs a comparison or two for each. Inside a scan's data, a 0xFF is followed by a zero or a restart marker, never
 *   by 0xD9.
 */
export function isCutShort(jpeg: Uint8Array): boolean {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8)
    return false;
  for (let offset = jpeg.length - 2; offset >= 2; offset--) {
    if (jpeg[offset] === 0xff && jpeg[offset + 1] === 0xd9)
      return false;
  }
  return true;
}
