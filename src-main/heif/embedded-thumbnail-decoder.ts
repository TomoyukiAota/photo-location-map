import { utilityProcess, UtilityProcess } from 'electron';
import * as pathModule from 'path';
import type { HeifEmbeddedThumbnail } from '../../src-shared/heif/heif-images.js';
import { logged, shown } from '../../src-shared/log/logged-line.js';
import { Logger } from '../../src-shared/log/logger.js';
import type { EmbeddedThumbnailAnswer } from './embedded-thumbnail-worker.js';

// TL;DR: The utility process that decodes thumbnail items with libheif (embedded-thumbnail-worker.ts): started at the
// first request, kept while requests come, and ended once idle, or once it has decoded many, as WebAssembly's memory
// does not shrink.
// Details: A process for each thumbnail, as today's generation of thumbnails starts (thumbnail-generation.ts), would
// spend more time starting, 80 to 100 ms to load and compile the decoder, than decoding, 4 ms. The page asks for
// one thumbnail at a time, two at most, so one process is enough.

const workerFile = pathModule.join(import.meta.dirname, 'embedded-thumbnail-worker.js');
const idleMs = 30_000;
const maxDecodesPerProcess = 2000;

type HevcThumbnail = Extract<HeifEmbeddedThumbnail, { kind: 'hevc' }>;

interface Pending {
  resolve(jpeg: Uint8Array): void;
  reject(error: Error): void;
}

interface Worker {
  readonly process: UtilityProcess;
  /** Settles once the process has started, which a message waits for, as the generation's workers do. */
  readonly spawned: Promise<void>;
}

let worker: Worker | undefined;
let decodes = 0;
let nextId = 0;
const pending = new Map<number, Pending>();
let idleTimer: ReturnType<typeof setTimeout> | undefined;

function start(): Worker {
  const started = utilityProcess.fork(workerFile, [], { serviceName: 'Photo Location Map HEIF Thumbnail Decoding' });
  const spawned = new Promise<void>(resolve => started.once('spawn', () => resolve()));
  started.on('message', (answer: EmbeddedThumbnailAnswer) => {
    const request = pending.get(answer.id);
    pending.delete(answer.id);
    if ('jpeg' in answer)
      request?.resolve(answer.jpeg);
    else
      request?.reject(new Error(answer.error));
    if (pending.size === 0)
      scheduleEnd();
  });
  // Without a listener, a fatal error in the process would be thrown in the main process (thumbnail-generation.ts).
  started.on('error', (type, location) => Logger.warn(logged`The process of HEIF thumbnail decoding had ${shown(type)} at ${location}.`));
  started.once('exit', code => {
    if (worker?.process === started)
      worker = undefined;
    for (const request of pending.values())
      request.reject(new Error(`The process of HEIF thumbnail decoding exited with code ${code}.`));
    pending.clear();
  });
  decodes = 0;
  return { process: started, spawned };
}

function scheduleEnd(): void {
  clearTimeout(idleTimer);
  if (decodes >= maxDecodesPerProcess) {
    end();
    return;
  }
  idleTimer = setTimeout(end, idleMs);
}

function end(): void {
  clearTimeout(idleTimer);
  worker?.process.kill();
  worker = undefined;
}

/** Decodes a thumbnail item to a JPEG of the image, cropped, turned and mirrored as the file has it. */
export function decodeEmbeddedThumbnailToJpeg(thumbnail: HevcThumbnail): Promise<Uint8Array> {
  clearTimeout(idleTimer);
  worker ??= start();
  decodes++;
  const id = nextId++;
  const { process, spawned } = worker;
  // Answered by the process, or rejected when it exits first, as one that could not start does.
  const answer = new Promise<Uint8Array>((resolve, reject) => pending.set(id, { resolve, reject }));
  void spawned.then(() => process.postMessage({ id, thumbnail }));
  return answer;
}
