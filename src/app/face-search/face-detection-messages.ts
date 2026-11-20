/** What the page asks the worker of the search for faces (face-detection.worker.ts): the best face score of an image. */
export interface FaceDetectionRequest {
  readonly id: number;
  /** The image, transferred to the worker, which closes it. */
  readonly image: ImageBitmap;
  /** The address of ONNX Runtime's WebAssembly, and that of the model, in the app's build (angular.json's assets). */
  readonly wasmUrl: string;
  readonly modelUrl: string;
}

/**
 * The worker's answer: the image's best face score, or why there is none. An error of the model is one of the model
 * or of its runtime, which no image can get past; an error of the image is of that image alone.
 */
export type FaceDetectionResponse =
  | { readonly id: number; readonly score: number }
  | { readonly id: number; readonly error: string; readonly stage: 'model' | 'image' };
