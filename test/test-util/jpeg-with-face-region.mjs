// A JPEG with a face region in its XMP, as Lightroom, digiKam or Picasa writes one for a face that someone has marked,
// for the search for faces, which takes such a photo as having a face without looking at it
// (src-main/face-search/face-regions.ts). Made from a JPEG of the test resources, as jpeg-with-location-only.mjs does,
// so that no such file has to be committed.

const xmp = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
  + '<rdf:Description rdf:about="" xmlns:mwg-rs="http://www.metadataworkinggroup.com/schemas/regions/"'
  + ' xmlns:stArea="http://ns.adobe.com/xmp/sType/Area#"><mwg-rs:Regions rdf:parseType="Resource"><mwg-rs:RegionList>'
  + '<rdf:Bag><rdf:li rdf:parseType="Resource"><mwg-rs:Type>Face</mwg-rs:Type>'
  + '<mwg-rs:Area stArea:x="0.5" stArea:y="0.5" stArea:w="0.1" stArea:h="0.1" stArea:unit="normalized"/>'
  + '</rdf:li></rdf:Bag></mwg-rs:RegionList></mwg-rs:Regions></rdf:Description></rdf:RDF></x:xmpmeta>';

/** The JPEG's bytes with an XMP segment of one face region right after its first marker, its EXIF kept as it is. */
export function jpegWithFaceRegion(sourceJpeg) {
  const payload = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xmp)]);
  const length = payload.length + 2;
  return Buffer.concat([sourceJpeg.subarray(0, 2), Buffer.from([0xff, 0xe1, length >> 8, length & 0xff]), payload, sourceJpeg.subarray(2)]);
}
