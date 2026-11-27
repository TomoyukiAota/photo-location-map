// A JPEG whose EXIF data link their first IFD to the second, which holds the thumbnail, past their own end, as EXIF
// data that an app cut short or wrote that link wrong in have it, and the rest of its EXIF data as they were, the
// location among them. exifr 7.1.3 parses such EXIF data, and throws "RangeError: Offset is outside the bounds of the
// DataView" when it extracts the thumbnail (src/app/shared/exif-fetcher/exif-read-failures.ts, extract-failed). Made
// from a JPEG of the test resources, as the other JPEGs of these helpers are, so that no such file has to be committed.

/**
 * `sourceJpeg` with the link from the first IFD of its EXIF data to the second set to just past the end of its EXIF
 * segment. Throws for a JPEG without EXIF data.
 */
export function jpegWithThumbnailLinkPastExif(sourceJpeg) {
  for (let offset = 2; offset + 4 <= sourceJpeg.length && sourceJpeg[offset] === 0xff;) {
    const marker = sourceJpeg[offset + 1];
    const length = sourceJpeg.readUInt16BE(offset + 2);
    if (marker === 0xe1 && sourceJpeg.toString('latin1', offset + 4, offset + 10) === 'Exif\0\0') {
      const tiff = offset + 10;
      // The segment's length counts its own 2 bytes and "Exif\0\0" before the TIFF data.
      const tiffLength = length - 8;
      const littleEndian = sourceJpeg.toString('latin1', tiff, tiff + 2) === 'II';
      const read16 = at => littleEndian ? sourceJpeg.readUInt16LE(at) : sourceJpeg.readUInt16BE(at);
      const read32 = at => littleEndian ? sourceJpeg.readUInt32LE(at) : sourceJpeg.readUInt32BE(at);
      const ifd0 = tiff + read32(tiff + 4);
      const link = ifd0 + 2 + 12 * read16(ifd0);
      const jpeg = Buffer.from(sourceJpeg);
      if (littleEndian)
        jpeg.writeUInt32LE(tiffLength + 2, link);
      else
        jpeg.writeUInt32BE(tiffLength + 2, link);
      return jpeg;
    }
    offset += 2 + length;
  }
  throw new Error('The JPEG has no EXIF data.');
}
