// A JPEG whose EXIF has a location and a shooting time, and nothing else: a photo taken where and when a case needs,
// as at the site of EXPO 2025, which no photo of the test resources is. Made from a JPEG of the test resources, as
// jpeg-with-location-only.mjs does, so that no such file has to be committed.
import { withExifReplaced } from './jpeg-with-empty-gps-values.mjs';

/** Writes a coordinate as the three RATIONALs of EXIF: degrees, minutes and seconds (to 1/100). */
export function writeDegreesMinutesSeconds(tiff, offset, coordinate) {
  const degrees = Math.floor(coordinate);
  const minutes = Math.floor((coordinate - degrees) * 60);
  const hundredthsOfSeconds = Math.round(((coordinate - degrees) * 60 - minutes) * 60 * 100);
  [[degrees, 1], [minutes, 1], [hundredthsOfSeconds, 100]].forEach(([numerator, denominator], i) => {
    tiff.writeUInt32LE(numerator, offset + 8 * i);
    tiff.writeUInt32LE(denominator, offset + 8 * i + 4);
  });
}

/** The source JPEG, taken at `latitude` and `longitude` at `dateTime`, as EXIF writes it: "YYYY:MM:DD HH:MM:SS". */
export function jpegWithLocationAndDate(sourceJpeg, latitude, longitude, dateTime) {
  if (!/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) throw new Error(`Not an EXIF date and time: ${dateTime}`);
  // The TIFF header, IFD0 with two entries (the EXIF and GPS blocks' offsets), the EXIF block with one entry
  // (DateTimeOriginal) and its value, then the GPS block with four entries and its values.
  const ifd0Offset = 8;
  const exifOffset = ifd0Offset + 2 + 12 * 2 + 4;
  const dateOffset = exifOffset + 2 + 12 + 4;
  const gpsOffset = dateOffset + 20;
  const gpsEntryCount = 4;
  const gpsValuesOffset = gpsOffset + 2 + 12 * gpsEntryCount + 4;
  const tiff = Buffer.alloc(gpsValuesOffset + 2 * 24);
  tiff.write('II*\0', 0, 'latin1');
  tiff.writeUInt32LE(ifd0Offset, 4);
  /** Writes an entry's tag, type and count at `offset`, and gives the offset of its value. */
  const entry = (offset, tag, type, count) => {
    tiff.writeUInt16LE(tag, offset);
    tiff.writeUInt16LE(type, offset + 2);
    tiff.writeUInt32LE(count, offset + 4);
    return offset + 8;
  };
  tiff.writeUInt16LE(2, ifd0Offset);
  tiff.writeUInt32LE(exifOffset, entry(ifd0Offset + 2, 0x8769, 4, 1)); // ExifIFDPointer, LONG
  tiff.writeUInt32LE(gpsOffset, entry(ifd0Offset + 2 + 12, 0x8825, 4, 1)); // GPSInfo, LONG
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
  return withExifReplaced(sourceJpeg, tiff);
}
