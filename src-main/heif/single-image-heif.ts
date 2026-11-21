// TL;DR: A HEIF file of one HEVC picture, made from a thumbnail item, so that heic-decode, which decodes a file's
// primary image, decodes the thumbnail alone (src-main/heif/embedded-thumbnail-worker.ts).
// Details: The file has what libheif needs and nothing else: ftyp; meta with hdlr `pict`, pitm, iloc, iinf, and the
// properties hvcC and ispe; then mdat with the picture. ispe is the size of the decoded picture, which libheif checks,
// and no transformation: the worker crops and turns the image itself.

function box(type: string, ...parts: Buffer[]): Buffer {
  const body = Buffer.concat(parts);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
}

function fullBox(type: string, version: number, flags: number, ...parts: Buffer[]): Buffer {
  const versionAndFlags = Buffer.alloc(4);
  versionAndFlags.writeUInt32BE(((version & 0xff) << 24 | (flags & 0xffffff)) >>> 0);
  return box(type, versionAndFlags, ...parts);
}

function uint16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value);
  return buffer;
}

function uint32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

/** A HEIF file whose primary image is the HEVC picture `data`, of `width` x `height`, configured by `hvcC`. */
export function singleImageHeif(hvcC: Uint8Array, data: Uint8Array, width: number, height: number): Buffer {
  const ftyp = box('ftyp', Buffer.from('heic'), uint32(0), Buffer.from('mif1heic'));
  const hdlr = fullBox('hdlr', 0, 0, uint32(0), Buffer.from('pict'), Buffer.alloc(12), Buffer.from([0]));
  const pitm = fullBox('pitm', 0, 0, uint16(1));
  const infe = fullBox('infe', 2, 0, uint16(1), uint16(0), Buffer.from('hvc1'), Buffer.from([0]));
  const iinf = fullBox('iinf', 0, 0, uint16(1), infe);
  const ipco = box('ipco', box('hvcC', Buffer.from(hvcC)), fullBox('ispe', 0, 0, uint32(width), uint32(height)));
  // The item's two properties, hvcC essential.
  const ipma = fullBox('ipma', 0, 0, uint32(1), uint16(1), Buffer.from([2, 0x80 | 1, 2]));
  const iprp = box('iprp', ipco, ipma);
  // iloc version 0: 4-byte offsets and lengths, no base offset; one item with one extent.
  const iloc = (offset: number) => fullBox('iloc', 0, 0, Buffer.from([0x44, 0x00]), uint16(1), uint16(1), uint16(0),
    uint16(1), uint32(offset), uint32(data.length));
  const meta = (offset: number) => fullBox('meta', 0, 0, hdlr, pitm, iloc(offset), iinf, iprp);
  // The picture follows ftyp, meta and the header of mdat; the size of meta does not depend on the offset's value.
  const offset = ftyp.length + meta(0).length + 8;
  return Buffer.concat([ftyp, meta(offset), box('mdat', Buffer.from(data))]);
}
