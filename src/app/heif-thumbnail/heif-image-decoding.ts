import type { HeifEmbeddedThumbnail, HeifTransformations, HeifWholeImage, HevcConfiguration } from '../../../src-shared/heif/heif-images.js';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata.js';
import { tilePlacements } from './tile-placement.js';

// TL;DR: Decodes a HEIF photo's images in the page with WebCodecs' VideoDecoder, which hands HEVC to the operating
// system's decoder, in the graphics hardware where it has one, and makes of them the JPEG that a thumbnail shows.
// Details:
// - Measured on an Apple M5 with 1,000 iPhone photos: the thumbnail item in 4 ms (decoding 2.4, the JPEG 1.1), the
//   whole image at 400 pixels in 21 ms for 12 megapixels and 34 ms for 48, against 630 and 1,940 ms in the generation
//   of thumbnails (src-main/thumbnail-generation/), which decodes with libheif in WebAssembly. The colours are as close
//   to macOS's own rendering as the generation's: iPhone thumbnails signal Display P3, which Chromium converts.
// - Chromium decodes HEVC only with the platform's decoder: on macOS 11 and later (VideoToolbox, in software where the
//   Mac has no hardware for it), and on Windows 8 and later with a graphics adapter that decodes HEVC (D3D11VA; no
//   Store extension needed). Linux has none unless VA-API is set up, so its page decodes nothing here, and a Windows
//   PC without such an adapter, or a virtual machine, neither: the main process makes their thumbnails.
// - The decoded frame is drawn on an OffscreenCanvas, cropped, turned and mirrored as the file says, then encoded as
//   a JPEG of quality 0.92, the generation's, for an img element.

const jpegQuality = 0.92;
/** How long a decoding may take before it is taken as failed, which no decoder takes in practice. */
const decodingTimeoutMs = 10_000;

let pageDecodesHevcAnswer: Promise<boolean> | undefined;

/**
 * Whether the page decodes HEVC, as Chromium does on macOS and on most Windows PCs: once, for the Main profile; a
 * profile of a photo is checked before it is decoded (isSupported). A test profile turns it off with
 * PLM_TEST_HEVC_IN_PAGE=off, so that the tests of the generation run the same on every platform.
 */
export function pageDecodesHevc(): Promise<boolean> {
  pageDecodesHevcAnswer ??= (async () => {
    if (startupMetadata().hevcInPage === 'off' || typeof VideoDecoder === 'undefined')
      return false;
    try {
      return (await VideoDecoder.isConfigSupported({ codec: 'hvc1.1.6.L93.B0' })).supported === true;
    } catch {
      return false;
    }
  })();
  return pageDecodesHevcAnswer;
}

const supportedConfigurations = new Map<string, Promise<boolean>>();

/** Whether the page decodes pictures of this configuration: its profile, such as Canon's 4:2:2, and its size. */
export function isSupported(hevc: HevcConfiguration): Promise<boolean> {
  const key = `${hevc.codec} ${hevc.codedWidth}x${hevc.codedHeight}`;
  let answer = supportedConfigurations.get(key);
  if (!answer) {
    answer = pageDecodesHevc().then(async decodes => {
      if (!decodes)
        return false;
      try {
        return (await VideoDecoder.isConfigSupported(decoderConfig(hevc))).supported === true;
      } catch {
        return false;
      }
    });
    supportedConfigurations.set(key, answer);
  }
  return answer;
}

function decoderConfig(hevc: HevcConfiguration): VideoDecoderConfig {
  return { codec: hevc.codec, description: hevc.description, codedWidth: hevc.codedWidth, codedHeight: hevc.codedHeight,
    optimizeForLatency: true };
}

/**
 * Decodes coded pictures with one VideoDecoder, giving each frame to `draw` as it comes and closing it then: a decoder
 * stalls while it has frames that are not closed. Rejects when the decoder fails, or gives fewer frames.
 */
async function decodeFrames(hevc: HevcConfiguration, pictures: readonly Uint8Array[], draw: (frame: VideoFrame, index: number) => void): Promise<void> {
  let failure: unknown;
  let drawn = 0;
  const decoder = new VideoDecoder({
    output: frame => {
      try {
        if (failure === undefined)
          draw(frame, frame.timestamp);
        drawn++;
      } catch (error) {
        failure ??= error;
      } finally {
        frame.close();
      }
    },
    error: error => { failure ??= error; },
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    decoder.configure(decoderConfig(hevc));
    pictures.forEach((data, index) => decoder.decode(new EncodedVideoChunk({ type: 'key', timestamp: index, data })));
    await Promise.race([
      decoder.flush(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('The decoding took too long.')), decodingTimeoutMs); }),
    ]);
  } catch (error) {
    failure ??= error;
  } finally {
    clearTimeout(timer);
    if (decoder.state !== 'closed')
      decoder.close();
  }
  if (failure !== undefined)
    throw failure instanceof Error ? failure : new Error(String(failure));
  if (drawn !== pictures.length)
    throw new Error(`The decoder gave ${drawn} of ${pictures.length} pictures.`);
}

/**
 * `image`, of `width` x `height`, turned and mirrored onto a canvas of its own: turned anti-clockwise by `rotation`,
 * then mirrored about a vertical (0) or horizontal (1) axis.
 */
function turned(image: CanvasImageSource, width: number, height: number, { rotation, mirror }: Omit<HeifTransformations, 'crop'>): OffscreenCanvas {
  const sideways = rotation === 90 || rotation === 270;
  const canvas = new OffscreenCanvas(sideways ? height : width, sideways ? width : height);
  const context = canvas.getContext('2d');
  context.translate(canvas.width / 2, canvas.height / 2);
  // The canvas applies these to what is drawn in the reverse order: turned first, then mirrored.
  if (mirror === 0)
    context.scale(-1, 1);
  else if (mirror === 1)
    context.scale(1, -1);
  context.rotate(-rotation * Math.PI / 180);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  return canvas;
}

function jpegOf(canvas: OffscreenCanvas): Promise<Blob> {
  return canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality });
}

/** A JPEG of a thumbnail item: cropped, turned and mirrored as the file says. */
export async function decodeEmbeddedThumbnail(thumbnail: HeifEmbeddedThumbnail): Promise<Blob> {
  const { crop } = thumbnail;
  const cropped = new OffscreenCanvas(crop.width, crop.height);
  const context = cropped.getContext('2d');
  if (thumbnail.kind === 'jpeg') {
    const bitmap = await createImageBitmap(new Blob([thumbnail.data as BlobPart], { type: 'image/jpeg' }));
    try {
      context.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    } finally {
      bitmap.close();
    }
  } else {
    await decodeFrames(thumbnail.hevc, [thumbnail.data], frame =>
      context.drawImage(frame, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height));
  }
  return jpegOf(turned(cropped, crop.width, crop.height, thumbnail));
}

/**
 * A JPEG of the whole image, at `longerSide` pixels on its longer side: each tile drawn small in its place as it is
 * decoded, into whole pixels (tilePlacements), which takes as long as drawing them whole and resizing once, without a
 * canvas of the whole image.
 */
export async function decodeWholeImage(image: HeifWholeImage, longerSide: number): Promise<Blob> {
  const { crop } = image;
  const scale = Math.min(1, longerSide / Math.max(crop.width, crop.height));
  const width = Math.max(1, Math.round(crop.width * scale));
  const height = Math.max(1, Math.round(crop.height * scale));
  const small = new OffscreenCanvas(width, height);
  const context = small.getContext('2d');
  context.imageSmoothingQuality = 'high';
  const placements = tilePlacements(image, width, height);
  await decodeFrames(image.hevc, image.tiles, (frame, index) => {
    const placement = placements[index];
    if (!placement)
      return;
    const { source, destination } = placement;
    context.drawImage(frame, source.x, source.y, source.width, source.height,
      destination.x, destination.y, destination.width, destination.height);
  });
  return jpegOf(turned(small, width, height, image));
}
