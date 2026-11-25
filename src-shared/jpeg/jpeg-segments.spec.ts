import { jpegFrameSize, ReadBytes } from './jpeg-segments';

// The segments of a JPEG, as far as jpegFrameSize() reads them; not an image that anything could decode.
const soi = [0xff, 0xd8];
const jfif = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
/** An APP1 segment of `size` bytes of content, as large as EXIF data with a thumbnail are. */
const app1 = (size: number) => [0xff, 0xe1, (size + 2) >> 8, (size + 2) & 0xff, ...new Array<number>(size).fill(0x20)];
const quantizationTable = [0xff, 0xdb, 0x00, 0x05, 0x00, 0x01, 0x02];
/** A frame header, of one component, of the size given. */
const frameHeader = ({ marker = 0xc0, width = 2448, height = 3264 } = {}) =>
  [0xff, marker, 0x00, 0x0b, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x01, 0x01, 0x11, 0x00];
const scan = [0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x12, 0x34, 0xff, 0xd9];

/** A reader of the bytes, which records what it was asked for. */
function readerOf(...segments: number[][]): { read: ReadBytes, asked: [number, number][] } {
  const bytes = Uint8Array.from(segments.flat());
  const asked: [number, number][] = [];
  return {
    asked,
    read: async (offset, length) => {
      asked.push([offset, length]);
      return offset + length <= bytes.length ? bytes.slice(offset, offset + length) : undefined;
    },
  };
}

describe('jpegFrameSize', () => {
  it('gives the size in the frame header, whose segments before it it skips by their lengths', async () => {
    const { read, asked } = readerOf(soi, app1(30000), jfif, quantizationTable, frameHeader(), scan);
    expect(await jpegFrameSize(read)).toEqual({ width: 2448, height: 3264 });
    // The start, the header of each segment, and the frame's size: none of the EXIF segment's content.
    expect(asked).toEqual([[0, 2], [2, 4], [30006, 4], [30024, 4], [30031, 4], [30035, 5]]);
  });

  it('takes the frame header of any coding, and skips the bytes of 0xFF that fill the room before a marker', async () => {
    for (const marker of [0xc0, 0xc1, 0xc2, 0xc3, 0xc9, 0xca, 0xcf])
      expect(await jpegFrameSize(readerOf(soi, frameHeader({ marker, width: 4032, height: 3024 }), scan).read)).toEqual({ width: 4032, height: 3024 });
    expect(await jpegFrameSize(readerOf(soi, [0xff, 0xff], jfif, [0xff], frameHeader(), scan).read)).toEqual({ width: 2448, height: 3264 });
  });

  it('skips the segments whose markers are not frame headers: DHT, JPG and DAC', async () => {
    const segment = (marker: number) => [0xff, marker, 0x00, 0x04, 0x00, 0x00];
    expect(await jpegFrameSize(readerOf(soi, segment(0xc4), segment(0xc8), segment(0xcc), frameHeader(), scan).read))
      .toEqual({ width: 2448, height: 3264 });
  });

  it('is null for what is not a JPEG, and for one whose segments end or break before a frame header', async () => {
    expect(await jpegFrameSize(readerOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).read)).toBeNull();
    expect(await jpegFrameSize(readerOf([0xff]).read)).toBeNull();
    // The scan before a frame header, a marker alone, and a segment shorter than its length.
    expect(await jpegFrameSize(readerOf(soi, jfif, scan).read)).toBeNull();
    expect(await jpegFrameSize(readerOf(soi, [0xff, 0xd0], frameHeader(), scan).read)).toBeNull();
    expect(await jpegFrameSize(readerOf(soi, app1(30000).slice(0, 1000)).read)).toBeNull();
    // Bytes that are not a marker, and a length that does not count its own bytes.
    expect(await jpegFrameSize(readerOf(soi, [0x00, 0x00], frameHeader(), scan).read)).toBeNull();
    expect(await jpegFrameSize(readerOf(soi, [0xff, 0xe1, 0x00, 0x01], frameHeader(), scan).read)).toBeNull();
  });

  it('is null for a frame header without a height, which a DNL segment after the scan would give, or without a width', async () => {
    expect(await jpegFrameSize(readerOf(soi, frameHeader({ height: 0 }), scan).read)).toBeNull();
    expect(await jpegFrameSize(readerOf(soi, frameHeader({ width: 0 }), scan).read)).toBeNull();
    expect(await jpegFrameSize(readerOf(soi, [0xff, 0xc0, 0x00, 0x06, 0x08, 0x0c, 0xc0, 0x09], scan).read)).toBeNull();
  });
});
