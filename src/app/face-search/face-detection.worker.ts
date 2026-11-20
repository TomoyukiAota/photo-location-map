/// <reference lib="webworker" />
// The worker of the search for faces: YuNet on ONNX Runtime Web, off the page's thread.
// TL;DR: One request at a time, in order: an image in, its best face score out. Nothing leaves the worker but that
// number, which the page keeps (face-search.service.ts).
// Details:
// - On the page's thread, a run of the model, about 20 ms, would hold up the page: 50 photos in a row were one task
//   of a second. In this worker, they are none.
// - One thread: the page is not cross-origin isolated, so ONNX Runtime could not start threads of its own anyway.
// - The runtime's .wasm file and the model are files of the app's build, fetched from the app's own origin, which the
//   page's Content Security Policy lets this worker do, and compile, and nothing else (src-main/file-server/).
import * as ort from 'onnxruntime-web/wasm';
import type { FaceDetectionRequest, FaceDetectionResponse } from './face-detection-messages';
import { bestFaceScore, bgrPlanesOf, letterboxScale, yunetInputSize } from './yunet';

let session: Promise<ort.InferenceSession> | undefined;
const canvas = new OffscreenCanvas(yunetInputSize, yunetInputSize);
const context = canvas.getContext('2d', { willReadFrequently: true });

/** The model, loaded at the first request. A failure to load it stays, as no request can get past it. */
function model(request: FaceDetectionRequest): Promise<ort.InferenceSession> {
  if (!session) {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = { wasm: request.wasmUrl };
    session = ort.InferenceSession.create(request.modelUrl, { executionProviders: ['wasm'] });
  }
  return session;
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/**
 * The image as YuNet takes it: scaled to fill its square input from the top left, as large as fits, on black, which
 * is what OpenCV pads with.
 */
function inputOf(image: ImageBitmap): ort.Tensor {
  const scale = letterboxScale(image.width, image.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, yunetInputSize, yunetInputSize);
  context.drawImage(image, 0, 0, image.width * scale, image.height * scale);
  const rgba = context.getImageData(0, 0, yunetInputSize, yunetInputSize).data;
  return new ort.Tensor('float32', bgrPlanesOf(rgba), [1, 3, yunetInputSize, yunetInputSize]);
}

async function answer(request: FaceDetectionRequest): Promise<FaceDetectionResponse> {
  let detector: ort.InferenceSession;
  try {
    detector = await model(request);
  } catch (error) {
    return { id: request.id, error: describe(error), stage: 'model' };
  }
  try {
    const outputs = await detector.run({ input: inputOf(request.image) });
    return { id: request.id, score: bestFaceScore(outputs) };
  } catch (error) {
    return { id: request.id, error: describe(error), stage: 'image' };
  }
}

// Requests are answered in turn: the canvas is one, and the model runs one image at a time anyway.
let queue = Promise.resolve();
addEventListener('message', (event: MessageEvent<FaceDetectionRequest>) => {
  const request = event.data;
  queue = queue.then(async () => {
    try {
      postMessage(await answer(request));
    } finally {
      request.image.close();
    }
  });
});
