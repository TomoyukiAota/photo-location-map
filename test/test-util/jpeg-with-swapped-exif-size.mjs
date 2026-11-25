// A JPEG whose EXIF data give the size of its pixels as it was before an app turned them by a quarter, as an app that
// turns a photo's pixels without writing that size anew leaves them. Made from a JPEG of the test resources, as the
// other JPEGs of these helpers are, so that no such file has to be committed.

/**
 * `sourceJpeg` with the entries of PixelXDimension (0xA002) and PixelYDimension (0xA003) of its EXIF data swapped, but
 * for their tags, which keep their order: the type, the count and the value of each, a SHORT or a LONG, which is in the
 * entry itself. Throws for a JPEG without both.
 */
export function jpegWithSwappedExifSize(sourceJpeg) {
  for (let offset = 2; offset + 4 <= sourceJpeg.length && sourceJpeg[offset] === 0xff;) {
    const marker = sourceJpeg[offset + 1];
    const length = sourceJpeg.readUInt16BE(offset + 2);
    if (marker === 0xe1 && sourceJpeg.toString('latin1', offset + 4, offset + 10) === 'Exif\0\0') {
      const tiff = offset + 10;
      const littleEndian = sourceJpeg.toString('latin1', tiff, tiff + 2) === 'II';
      const read16 = at => littleEndian ? sourceJpeg.readUInt16LE(at) : sourceJpeg.readUInt16BE(at);
      const read32 = at => littleEndian ? sourceJpeg.readUInt32LE(at) : sourceJpeg.readUInt32BE(at);
      const entriesOf = ifd => Array.from({ length: read16(tiff + ifd) }, (_, index) => tiff + ifd + 2 + 12 * index);
      const exifPointer = entriesOf(read32(tiff + 4)).find(at => read16(at) === 0x8769);
      if (!exifPointer)
        break;
      const entries = entriesOf(read32(exifPointer + 8));
      const [width, height] = [0xa002, 0xa003].map(tag => entries.find(at => read16(at) === tag && [3, 4].includes(read16(at + 2))));
      if (!width || !height)
        break;
      const jpeg = Buffer.from(sourceJpeg);
      const widthEntry = Buffer.from(jpeg.subarray(width + 2, width + 12));
      jpeg.copy(jpeg, width + 2, height + 2, height + 12);
      widthEntry.copy(jpeg, height + 2);
      return jpeg;
    }
    offset += 2 + length;
  }
  throw new Error('The JPEG has no PixelXDimension and PixelYDimension in its EXIF data.');
}
