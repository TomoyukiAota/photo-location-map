// A JPEG whose EXIF thumbnail Chromium cannot decode, as a camera or an app that writes a broken one leaves it, and the
// rest of its EXIF data as they were, the location among them. Made from a JPEG of the test resources, as the other
// JPEGs of these helpers are, so that no such file has to be committed.

/**
 * `sourceJpeg` with the thumbnail of its EXIF data given a quantization table of the number 5, which JPEG does not have
 * (0 to 3). Chromium then cannot read the thumbnail's tables, and an img element fires its error, while the frame's
 * header, which the page reads for the thumbnail's size, stays as it was
 * (src/app/photo-info-viewer/undecodable-thumbnail.service.ts). Throws for a JPEG without such a thumbnail.
 */
export function jpegWithUndecodableExifThumbnail(sourceJpeg) {
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
      // The second IFD holds the thumbnail: JPEGInterchangeFormat (0x0201) is where it starts, from the TIFF header.
      const entries = ifd1 === 0 ? [] : Array.from({ length: read16(tiff + ifd1) }, (_, index) => tiff + ifd1 + 2 + 12 * index);
      const entry = entries.find(at => read16(at) === 0x0201);
      if (!entry)
        break;
      const thumbnail = tiff + read32(entry + 8);
      if (sourceJpeg.readUInt16BE(thumbnail) !== 0xffd8)
        break;
      // The thumbnail's segments up to its scan (SOS), for its first DQT: its marker, its length, then the precision
      // and the number of its first table in one byte.
      for (let at = thumbnail + 2; sourceJpeg[at] === 0xff && sourceJpeg[at + 1] !== 0xda; at += 2 + sourceJpeg.readUInt16BE(at + 2)) {
        if (sourceJpeg[at + 1] === 0xdb) {
          const jpeg = Buffer.from(sourceJpeg);
          jpeg[at + 4] = (jpeg[at + 4] & 0xf0) | 5;
          return jpeg;
        }
      }
      break;
    }
    offset += 2 + length;
  }
  throw new Error('The JPEG has no EXIF thumbnail with a quantization table.');
}
