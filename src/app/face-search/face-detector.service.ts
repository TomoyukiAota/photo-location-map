import { Service } from '@angular/core';
import type { FaceDetectionRequest, FaceDetectionResponse } from './face-detection-messages';

/** A failure of the face detector: of its model, which no photo can get past, or of one photo's image. */
export class FaceDetectorError extends Error {
  public constructor(message: string, public readonly stage: 'model' | 'image') {
    super(message);
    this.name = 'FaceDetectorError';
  }
}

/** A file of the face detector in the app's build: angular.json copies them to assets/face-search/. */
function assetUrl(fileName: string): string {
  return new URL(`assets/face-search/${fileName}`, document.baseURI).href;
}

/**
 * The face detector, YuNet, which runs in a worker of the page (face-detection.worker.ts): the best face score of an
 * image.
 * TL;DR: The worker starts at the first image, and stays for the next search, so that its model is loaded once.
 * Details: The images are transferred to the worker, which answers them in turn; a photo is decoded on the page's side
 * while the worker looks at the one before (face-search.service.ts).
 */
@Service()
export class FaceDetectorService {
  private worker: Worker | undefined;
  private nextId = 0;
  private readonly pending = new Map<number, { resolve: (score: number) => void; reject: (error: unknown) => void }>();

  /** The image's best face score, from 0 to 1; the image is transferred, so it cannot be used after. */
  public score(image: ImageBitmap): Promise<number> {
    const worker = this.worker ?? this.startWorker();
    const id = this.nextId++;
    const request: FaceDetectionRequest = {
      id, image, wasmUrl: assetUrl('ort-wasm-simd-threaded.wasm'), modelUrl: assetUrl('face_detection_yunet_2023mar.onnx'),
    };
    return new Promise<number>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage(request, [image]);
    });
  }

  /** The worker, made from its own chunk of the app's build. */
  protected createWorker(): Worker {
    return new Worker(new URL('./face-detection.worker', import.meta.url), { type: 'module', name: 'face-detection' });
  }

  private startWorker(): Worker {
    const worker = this.createWorker();
    worker.addEventListener('message', (event: MessageEvent<FaceDetectionResponse>) => this.settle(event.data));
    // A worker that cannot start, or fails as a whole, answers nothing more: what waits fails as the model would.
    worker.addEventListener('error', event => this.failAll(new FaceDetectorError(`The face detector failed: ${event.message}`, 'model')));
    this.worker = worker;
    return worker;
  }

  private settle(response: FaceDetectionResponse): void {
    const waiting = this.pending.get(response.id);
    if (!waiting)
      return;
    this.pending.delete(response.id);
    if ('score' in response)
      waiting.resolve(response.score);
    else
      waiting.reject(new FaceDetectorError(response.error, response.stage));
  }

  private failAll(error: FaceDetectorError): void {
    this.worker?.terminate();
    this.worker = undefined;
    for (const waiting of this.pending.values())
      waiting.reject(error);
    this.pending.clear();
  }
}
