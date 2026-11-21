import { TestBed } from '@angular/core/testing';
import type { FaceDetectionRequest, FaceDetectionResponse } from './face-detection-messages';
import { FaceDetectorError, FaceDetectorService } from './face-detector.service';

/** A worker that keeps what it is asked, and answers when the test says. */
class FakeWorker extends EventTarget {
  public readonly requests: FaceDetectionRequest[] = [];
  public terminated = false;

  public postMessage(request: FaceDetectionRequest): void {
    this.requests.push(request);
  }

  public terminate(): void {
    this.terminated = true;
  }

  public answer(response: FaceDetectionResponse): void {
    this.dispatchEvent(new MessageEvent('message', { data: response }));
  }
}

/** The detector, with fake workers in place of the worker of the build. */
class DetectorWithFakeWorkers extends FaceDetectorService {
  public readonly workers: FakeWorker[] = [];

  protected override createWorker(): Worker {
    const worker = new FakeWorker();
    this.workers.push(worker);
    return worker as unknown as Worker;
  }
}

describe('FaceDetectorService', () => {
  let detector: DetectorWithFakeWorkers;
  const image = () => ({}) as ImageBitmap;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DetectorWithFakeWorkers] });
    detector = TestBed.inject(DetectorWithFakeWorkers);
  });

  it('starts one worker at the first image, gives it the files of the build, and settles each image by its id', async () => {
    const first = detector.score(image());
    const second = detector.score(image());
    expect(detector.workers).toHaveLength(1);
    const [worker] = detector.workers;
    expect(worker.requests.map(request => request.id)).toEqual([0, 1]);
    expect(worker.requests[0].wasmUrl).toMatch(/\/assets\/face-search\/ort-wasm-simd-threaded\.wasm$/);
    expect(worker.requests[0].modelUrl).toMatch(/\/assets\/face-search\/face_detection_yunet_2023mar\.onnx$/);

    worker.answer({ id: 1, score: 0.2 });
    worker.answer({ id: 0, score: 0.9 });
    expect(await first).toBe(0.9);
    expect(await second).toBe(0.2);
  });

  it('fails an image that cannot be looked at, and keeps the worker for the next', async () => {
    const failing = detector.score(image());
    const next = detector.score(image());
    const [worker] = detector.workers;
    worker.answer({ id: 0, error: 'RangeError: bad image', stage: 'image' });
    await expect(failing).rejects.toEqual(new FaceDetectorError('RangeError: bad image', 'image'));

    worker.answer({ id: 1, score: 0.5 });
    expect(await next).toBe(0.5);
    expect(worker.terminated).toBe(false);
  });

  it('drops a worker whose model failed to load, with what waits for it, and loads the model again in a new one', async () => {
    const failing = detector.score(image());
    const waiting = detector.score(image());
    const [worker] = detector.workers;
    worker.answer({ id: 0, error: 'TypeError: Failed to fetch', stage: 'model' });
    await expect(failing).rejects.toMatchObject({ stage: 'model' });
    await expect(waiting).rejects.toMatchObject({ stage: 'model' });
    expect(worker.terminated).toBe(true);

    const retried = detector.score(image());
    expect(detector.workers).toHaveLength(2);
    detector.workers[1].answer({ id: 2, score: 0.95 });
    expect(await retried).toBe(0.95);
  });
});
