import decode from 'heic-decode';
import jpegJs from 'jpeg-js';
import type { HeifEmbeddedThumbnail } from '../../src-shared/heif/heif-images.js';
import { singleImageHeif } from './single-image-heif.js';
import { transformRgba } from './transform-rgba.js';

// TL;DR: Decodes HEIF thumbnail items to JPEG with libheif (heic-decode's WebAssembly build), for a page that cannot
// decode HEVC: on Linux, and on a Windows PC without a decoder for HEVC in its graphics hardware. One process serves
// the thumbnails one after another, until it is idle (src-main/heif/embedded-thumbnail-decoder.ts).
// Details: A thumbnail of 320x240 takes 3.8 ms to decode and 3.5 ms to encode on an Apple M5, against 400 to 1,400 ms
// for the whole photo. The JPEG's quality is today's thumbnail worker's, 92 (generate-thumbnail-file-worker.ts).

/** A request of the main process: the thumbnail item to decode, by a number that the answer repeats. */
export interface EmbeddedThumbnailRequest {
  readonly id: number;
  readonly thumbnail: Extract<HeifEmbeddedThumbnail, { kind: 'hevc' }>;
}

export type EmbeddedThumbnailAnswer =
  | { readonly id: number, readonly jpeg: Uint8Array }
  | { readonly id: number, readonly error: string };

const jpegQuality = 92;

export async function decodeToJpeg(thumbnail: EmbeddedThumbnailRequest['thumbnail']): Promise<Uint8Array> {
  const { hevc } = thumbnail;
  const file = singleImageHeif(hevc.description, thumbnail.data, hevc.codedWidth, hevc.codedHeight);
  const picture = await decode({ buffer: file });
  const image = transformRgba({ width: picture.width, height: picture.height, data: picture.data }, thumbnail);
  return new Uint8Array(jpegJs.encode({ data: Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength),
    width: image.width, height: image.height }, jpegQuality).data);
}

// The main process starts this file as a utility process; in a test, it is imported for decodeToJpeg.
if (process.parentPort) {
  process.parentPort.on('message', async ({ data }: { data: EmbeddedThumbnailRequest }) => {
    let answer: EmbeddedThumbnailAnswer;
    try {
      answer = { id: data.id, jpeg: await decodeToJpeg(data.thumbnail) };
    } catch (error) {
      answer = { id: data.id, error: error instanceof Error ? `${error.name}: ${error.message}` : String(error) };
    }
    process.parentPort.postMessage(answer);
  });
}
