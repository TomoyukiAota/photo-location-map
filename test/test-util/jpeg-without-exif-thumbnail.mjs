// A JPEG whose EXIF data lead to no thumbnail, as a camera or an app that writes none leaves them, and the rest of
// its EXIF data as they were, the location and the orientation among them. Made from a JPEG of the test resources, as
// the other JPEGs of these helpers are, so that no such file has to be committed.

/**
 * `sourceJpeg` with the link from its first IFD to the second, which holds the thumbnail, set to zero: the end of the
 * IFDs, so that no reader finds the thumbnail. Throws for a JPEG without EXIF data.
 */
export function jpegWithoutExifThumbnail(sourceJpeg) {
  for (let offset = 2; offset + 4 <= sourceJpeg.length && sourceJpeg[offset] === 0xff;) {
    const marker = sourceJpeg[offset + 1];
    const length = sourceJpeg.readUInt16BE(offset + 2);
    if (marker === 0xe1 && sourceJpeg.toString('latin1', offset + 4, offset + 10) === 'Exif\0\0') {
      const tiff = offset + 10;
      const littleEndian = sourceJpeg.toString('latin1', tiff, tiff + 2) === 'II';
      const read16 = at => littleEndian ? sourceJpeg.readUInt16LE(at) : sourceJpeg.readUInt16BE(at);
      const read32 = at => littleEndian ? sourceJpeg.readUInt32LE(at) : sourceJpeg.readUInt32BE(at);
      const ifd0 = tiff + read32(tiff + 4);
      const jpeg = Buffer.from(sourceJpeg);
      // Zero is the same in either byte order.
      jpeg.writeUInt32BE(0, ifd0 + 2 + 12 * read16(ifd0));
      return jpeg;
    }
    offset += 2 + length;
  }
  throw new Error('The JPEG has no EXIF data.');
}
