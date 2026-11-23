// TL;DR: Makes the thumbnail of a JPEG or PNG photo in the page from the bytes of its file: WebCodecs' ImageDecoder
// decodes them, Chromium's own decoder, to a smaller size where it can, and the page encodes a JPEG of 400 pixels.
// Details:
// - From the bytes, not from an img element or a Blob of the file. An image that the page loads stays in its memory
//   cache for the rest of the session, as an img element's did, which made the page hold 8.7 GB of 2,000 photos, and
//   a Blob stays in the main process until the page collects it (src/app/face-search/face-search-image.ts).
//   ImageDecoder keeps nothing once it is closed.
// - A JPEG is decoded at an eighth, a quarter, three eighths... of its size, the smallest that its decoder can make
//   that is still at least 400 pixels: measured on an Apple M5, a photo of 12 megapixels in 24 ms and one of 48 in
//   75, against 37 and 147 ms for the whole image. A PNG has no such decoding: one of 12 megapixels took 103 ms.
// - The frame is turned as the photo's EXIF orientation says (VideoFrame.rotation and flip), which drawImage applies,
//   as an img element shows the photo.
// - ImageDecoder exists only in a secure context, as the app's page is (src-main/privileged-schemes-setup.ts).

/** The longer side of a thumbnail, as the generation of HEIF thumbnails makes it: 200 CSS pixels at twice. */
export const thumbnailLongerSide = 400;

/**
 * The size that the decoder is asked for: twice the thumbnail's, on each side.
 * TL;DR: Chromium takes the size that it is asked for as a limit of the bytes decoded, and decodes at the largest
 * eighth of the photo's size that keeps within it, which can be smaller than the size asked for.
 * Details: Asked for 400x400, it decoded a photo of 2000x1500 at 250x188 and one of 3000x2250 at 375x282, both
 * smaller than a thumbnail; asked for twice that, at 750x563 for both, and a photo of 12 megapixels at 504x378 for
 * either. With twice the size, the decoded image is at least 400 pixels on its longer side, whatever the photo's size
 * and shape.
 */
const desiredSize = thumbnailLongerSide * 2;
/** The quality of the thumbnails' JPEGs, as those of HEIF photos. */
const jpegQuality = 0.92;
/** How long a decoding may take before it is taken as failed, which no photo took in practice. */
const decodingTimeoutMs = 10_000;

/**
 * The type of the image that `bytes` hold, by their first bytes, as Chromium tells an image's format, so that a file
 * whose name gives another format is decoded too; by its name when they say neither.
 */
export function imageTypeOf(bytes: Uint8Array, filePath: string): 'image/jpeg' | 'image/png' {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png';
  return /\.png$/i.test(filePath) ? 'image/png' : 'image/jpeg';
}

/** Whether the page has the decoder, as Chromium's page of a secure context has. */
export function pageHasImageDecoder(): boolean {
  return typeof ImageDecoder !== 'undefined';
}

/**
 * A JPEG of the photo whose file holds `bytes`, at most 400 pixels on its longer side, turned as the photo is shown.
 * What a PNG leaves transparent is white, as the page is around the thumbnail: a JPEG has no transparency, and shows
 * a transparent pixel black. Rejects when the photo cannot be decoded, as one whose file is cut short.
 * TL;DR: The decoder takes the bytes' buffer, rather than a copy of it, where the bytes are the whole of it, as those
 * that the main process sends are: they are empty afterwards.
 * Details: Copied, each photo's bytes stayed in the page until it collected its garbage, which it did later than it
 * made thumbnails: the page went up to 1.39 GB while it made those of 2,000 photos of 12 megapixels, 4.5 MB each,
 * against 903 MB while it showed the photos themselves. Taken, they go with the decoder.
 */
export async function makeThumbnailJpeg(bytes: Uint8Array, filePath: string): Promise<Blob> {
  const type = imageTypeOf(bytes, filePath);
  const isWholeBuffer = bytes.buffer instanceof ArrayBuffer && bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength;
  const decoder = new ImageDecoder({ data: bytes, type, desiredWidth: desiredSize, desiredHeight: desiredSize,
    transfer: isWholeBuffer ? [bytes.buffer as ArrayBuffer] : [] });
  let frame: VideoFrame | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const decoded = await Promise.race([
      decoder.decode(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('The decoding took too long.')), decodingTimeoutMs); }),
    ]);
    frame = decoded.image;
    const scale = Math.min(1, thumbnailLongerSide / Math.max(frame.displayWidth, frame.displayHeight));
    const width = Math.max(1, Math.round(frame.displayWidth * scale));
    const height = Math.max(1, Math.round(frame.displayHeight * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(frame, 0, 0, width, height);
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality });
  } finally {
    clearTimeout(timer);
    frame?.close();
    decoder.close();
  }
}
