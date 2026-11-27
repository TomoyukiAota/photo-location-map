// A TIFF file whose EXIF data have a location and a shooting time, and whose directories come after its pixels, as
// libtiff writes a file, past the first 64 KB of it. exifr 7.1.3 reads the directories where they are when it parses
// the EXIF data, but looks for them in the first 64 KB of the file when it extracts the thumbnail, and throws
// "RangeError: Offset is outside the bounds of the DataView" (src/app/shared/exif-fetcher/exif-read-failures.ts,
// extract-failed). Made here, as the test resources have no TIFF file with EXIF data, so that none has to be committed.
import { writeDegreesMinutesSeconds } from './jpeg-with-location-and-date.mjs';

/**
 * The TIFF file: its header, 512 x 256 grey pixels (128 KB), then IFD0, then the EXIF block with DateTimeOriginal and
 * the GPS block with the location, at `dateTime` as EXIF writes it ("YYYY:MM:DD HH:MM:SS").
 */
export function tiffWithDirectoriesAfterPixels(latitude, longitude, dateTime) {
  if (!/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) throw new Error(`Not an EXIF date and time: ${dateTime}`);
  const [width, height] = [512, 256];
  const pixelsOffset = 8;
  const ifd0Offset = pixelsOffset + width * height;
  const ifd0EntryCount = 10;
  const exifOffset = ifd0Offset + 2 + 12 * ifd0EntryCount + 4;
  const dateOffset = exifOffset + 2 + 12 + 4;
  const gpsOffset = dateOffset + 20;
  const gpsEntryCount = 4;
  const gpsValuesOffset = gpsOffset + 2 + 12 * gpsEntryCount + 4;
  const tiff = Buffer.alloc(gpsValuesOffset + 2 * 24);
  tiff.write('II*\0', 0, 'latin1');
  tiff.writeUInt32LE(ifd0Offset, 4);
  tiff.fill(0x80, pixelsOffset, ifd0Offset);
  /** Writes an entry's tag, type and count at `offset`, and gives the offset of its value. */
  const entry = (offset, tag, type, count) => {
    tiff.writeUInt16LE(tag, offset);
    tiff.writeUInt16LE(type, offset + 2);
    tiff.writeUInt32LE(count, offset + 4);
    return offset + 8;
  };
  // In the order of their tags, as TIFF has them; each value fits in its entry. The link to a next IFD is zero: none.
  const ifd0Entry = index => ifd0Offset + 2 + 12 * index;
  tiff.writeUInt16LE(ifd0EntryCount, ifd0Offset);
  tiff.writeUInt32LE(width, entry(ifd0Entry(0), 0x0100, 4, 1)); // ImageWidth, LONG
  tiff.writeUInt32LE(height, entry(ifd0Entry(1), 0x0101, 4, 1)); // ImageLength, LONG
  tiff.writeUInt16LE(8, entry(ifd0Entry(2), 0x0102, 3, 1)); // BitsPerSample, SHORT
  tiff.writeUInt16LE(1, entry(ifd0Entry(3), 0x0103, 3, 1)); // Compression, SHORT: none
  tiff.writeUInt16LE(1, entry(ifd0Entry(4), 0x0106, 3, 1)); // PhotometricInterpretation, SHORT: black is zero
  tiff.writeUInt32LE(pixelsOffset, entry(ifd0Entry(5), 0x0111, 4, 1)); // StripOffsets, LONG
  tiff.writeUInt32LE(height, entry(ifd0Entry(6), 0x0116, 4, 1)); // RowsPerStrip, LONG
  tiff.writeUInt32LE(width * height, entry(ifd0Entry(7), 0x0117, 4, 1)); // StripByteCounts, LONG
  tiff.writeUInt32LE(exifOffset, entry(ifd0Entry(8), 0x8769, 4, 1)); // ExifIFDPointer, LONG
  tiff.writeUInt32LE(gpsOffset, entry(ifd0Entry(9), 0x8825, 4, 1)); // GPSInfo, LONG
  tiff.writeUInt16LE(1, exifOffset);
  tiff.writeUInt32LE(dateOffset, entry(exifOffset + 2, 0x9003, 2, 20)); // DateTimeOriginal, ASCII, 19 characters and a 0
  tiff.write(dateTime, dateOffset, 'latin1');
  tiff.writeUInt16LE(gpsEntryCount, gpsOffset);
  const gpsEntry = index => gpsOffset + 2 + 12 * index;
  tiff.write(latitude >= 0 ? 'N' : 'S', entry(gpsEntry(0), 0x0001, 2, 2), 'latin1'); // GPSLatitudeRef, "N\0" in place
  tiff.writeUInt32LE(gpsValuesOffset, entry(gpsEntry(1), 0x0002, 5, 3)); // GPSLatitude, RATIONAL × 3
  tiff.write(longitude >= 0 ? 'E' : 'W', entry(gpsEntry(2), 0x0003, 2, 2), 'latin1'); // GPSLongitudeRef
  tiff.writeUInt32LE(gpsValuesOffset + 24, entry(gpsEntry(3), 0x0004, 5, 3)); // GPSLongitude
  writeDegreesMinutesSeconds(tiff, gpsValuesOffset, Math.abs(latitude));
  writeDegreesMinutesSeconds(tiff, gpsValuesOffset + 24, Math.abs(longitude));
  return tiff;
}
