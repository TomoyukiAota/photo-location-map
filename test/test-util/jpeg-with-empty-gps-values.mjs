// A JPEG whose EXIF is only a GPS block whose latitude and longitude have no values and whose references are empty
// bytes, as some files have. For it, exifr 7.1.3 gives the latitude and the longitude as the text "NaNNaN": its
// ConvertDMSToDD(...GPSLatitude, GPSLatitudeRef) spreads no values, so the empty reference becomes the degrees, and
// an empty byte array plus NaN plus NaN is text. Leaflet throws on it ("Invalid LatLng object: (NaNNaN, NaNNaN)").
//
// Made from a JPEG of the test resources, with its APP1 segments (EXIF and XMP) replaced, so that no such file has
// to be committed.
export function jpegWithEmptyGpsValues(sourceJpeg) {
  const entries = [
    [0x0001, 7, 0], // GPSLatitudeRef, UNDEFINED, no bytes
    [0x0002, 5, 0], // GPSLatitude, RATIONAL, no values
    [0x0003, 7, 0], // GPSLongitudeRef
    [0x0004, 5, 0], // GPSLongitude
  ];
  const gpsOffset = 8 + 18; // After the TIFF header and IFD0, which has one entry.
  const tiff = Buffer.alloc(gpsOffset + 2 + 12 * entries.length + 4);
  tiff.write('II*\0', 0, 'latin1');
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x8825, 10); // GPSInfo, LONG, 1 value: the GPS block's offset.
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(gpsOffset, 18);
  tiff.writeUInt16LE(entries.length, gpsOffset);
  entries.forEach(([tag, type, count], i) => {
    const offset = gpsOffset + 2 + 12 * i;
    tiff.writeUInt16LE(tag, offset);
    tiff.writeUInt16LE(type, offset + 2);
    tiff.writeUInt32LE(count, offset + 4);
  });
  return withExifReplaced(sourceJpeg, tiff);
}

/** The source JPEG with its APP1 segments (EXIF and XMP) replaced by one EXIF APP1 of this TIFF data. */
export function withExifReplaced(sourceJpeg, tiff) {
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, 0, 0]), payload]);
  app1.writeUInt16BE(payload.length + 2, 2);

  // Every segment of the source but its APP1 segments, with this APP1 right after SOI.
  const segments = [sourceJpeg.subarray(0, 2), app1];
  let i = 2;
  while (sourceJpeg[i] === 0xff && sourceJpeg[i + 1] !== 0xda) {
    const end = i + 2 + sourceJpeg.readUInt16BE(i + 2);
    if (sourceJpeg[i + 1] !== 0xe1) segments.push(sourceJpeg.subarray(i, end));
    i = end;
  }
  segments.push(sourceJpeg.subarray(i));
  return Buffer.concat(segments);
}
