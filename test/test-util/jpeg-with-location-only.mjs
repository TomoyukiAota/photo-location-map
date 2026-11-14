// A JPEG whose EXIF has a location and nothing else, so no shooting time: a photo that the map shows and that the
// date-time-taken chart counts as date-unknown. Made from a JPEG of the test resources, as jpeg-with-empty-gps-values.mjs
// does, so that no such file has to be committed.
import { withExifReplaced } from './jpeg-with-empty-gps-values.mjs';

/** Writes a coordinate as the three RATIONALs of EXIF: degrees, minutes and seconds (to 1/100). */
function writeDegreesMinutesSeconds(tiff, offset, coordinate) {
  const degrees = Math.floor(coordinate);
  const minutes = Math.floor((coordinate - degrees) * 60);
  const hundredthsOfSeconds = Math.round(((coordinate - degrees) * 60 - minutes) * 60 * 100);
  [[degrees, 1], [minutes, 1], [hundredthsOfSeconds, 100]].forEach(([numerator, denominator], i) => {
    tiff.writeUInt32LE(numerator, offset + 8 * i);
    tiff.writeUInt32LE(denominator, offset + 8 * i + 4);
  });
}

export function jpegWithLocationOnly(sourceJpeg, latitude, longitude) {
  const gpsOffset = 8 + 18; // After the TIFF header and IFD0, which has one entry: the GPS block's offset.
  const entryCount = 4;
  const valuesOffset = gpsOffset + 2 + 12 * entryCount + 4; // After the GPS block and its next-IFD offset (0).
  const tiff = Buffer.alloc(valuesOffset + 2 * 24);
  tiff.write('II*\0', 0, 'latin1');
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x8825, 10); // GPSInfo, LONG, 1 value.
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(gpsOffset, 18);
  tiff.writeUInt16LE(entryCount, gpsOffset);
  /** Writes a GPS entry's tag, type and count, and gives the offset of its value. */
  const entry = (index, tag, type, count) => {
    const offset = gpsOffset + 2 + 12 * index;
    tiff.writeUInt16LE(tag, offset);
    tiff.writeUInt16LE(type, offset + 2);
    tiff.writeUInt32LE(count, offset + 4);
    return offset + 8;
  };
  tiff.write(latitude >= 0 ? 'N' : 'S', entry(0, 0x0001, 2, 2), 'latin1'); // GPSLatitudeRef, ASCII, "N\0" in place
  tiff.writeUInt32LE(valuesOffset, entry(1, 0x0002, 5, 3)); // GPSLatitude, RATIONAL × 3
  tiff.write(longitude >= 0 ? 'E' : 'W', entry(2, 0x0003, 2, 2), 'latin1'); // GPSLongitudeRef
  tiff.writeUInt32LE(valuesOffset + 24, entry(3, 0x0004, 5, 3)); // GPSLongitude
  writeDegreesMinutesSeconds(tiff, valuesOffset, Math.abs(latitude));
  writeDegreesMinutesSeconds(tiff, valuesOffset + 24, Math.abs(longitude));
  return withExifReplaced(sourceJpeg, tiff);
}
