// A JPEG whose EXIF data give a thumbnail cut short, as an app that rewrites them with the thumbnail's length too short
// leaves them, and the rest of its EXIF data as they were, the location among them. Made from a JPEG of the test
// resources, as the other JPEGs of these helpers are, so that no such file has to be committed.

/**
 * `sourceJpeg` with the length of the thumbnail of its EXIF data (JPEGInterchangeFormatLength, 0x0202, in the second
 * IFD) set to `fraction` of what it was, so that a reader gives the start of the thumbnail only, without its end
 * (src/app/shared/cut-short-jpeg.ts). Throws for a JPEG without such a thumbnail.
 */
export function jpegWithCutShortExifThumbnail(sourceJpeg, fraction = 0.6) {
  for (let offset = 2; offset + 4 <= sourceJpeg.length && sourceJpeg[offset] === 0xff;) {
    const marker = sourceJpeg[offset + 1];
    const length = sourceJpeg.readUInt16BE(offset + 2);
    if (marker === 0xe1 && sourceJpeg.toString('latin1', offset + 4, offset + 10) === 'Exif\0\0') {
      const tiff = offset + 10;
      const littleEndian = sourceJpeg.toString('latin1', tiff, tiff + 2) === 'II';
      const read16 = at => littleEndian ? sourceJpeg.readUInt16LE(at) : sourceJpeg.readUInt16BE(at);
      const read32 = at => littleEndian ? sourceJpeg.readUInt32LE(at) : sourceJpeg.readUInt32BE(at);
      const ifd0 = tiff + read32(tiff + 4);
      const ifd1 = read32(ifd0 + 2 + 12 * read16(ifd0));
      const entries = ifd1 === 0 ? [] : Array.from({ length: read16(tiff + ifd1) }, (_, index) => tiff + ifd1 + 2 + 12 * index);
      // A LONG, whose value is in the entry itself.
      const entry = entries.find(at => read16(at) === 0x0202 && read16(at + 2) === 4);
      if (!entry)
        break;
      const jpeg = Buffer.from(sourceJpeg);
      const cutShort = Math.floor(read32(entry + 8) * fraction);
      if (littleEndian)
        jpeg.writeUInt32LE(cutShort, entry + 8);
      else
        jpeg.writeUInt32BE(cutShort, entry + 8);
      return jpeg;
    }
    offset += 2 + length;
  }
  throw new Error('The JPEG has no EXIF thumbnail whose length is a LONG.');
}
