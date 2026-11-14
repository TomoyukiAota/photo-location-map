import assert = require('assert');
import * as os from 'os';
import * as path from 'path';
import { maxRecordedReasons, ThumbnailFailures } from '../../../src-main/thumbnail-generation/thumbnail-failures';

describe('ThumbnailFailures', () => {
  it('should count the files of each reason, the most frequent first', () => {
    const failures = new ThumbnailFailures();
    failures.add('worker-failed', new Error('Workerpool Worker terminated Unexpectedly'));
    failures.add('failed-in-heic-convert', 'Error: ERR_LIBHEIF format not supported');
    failures.add('failed-in-heic-convert', 'Error: ERR_LIBHEIF format not supported');

    assert.deepStrictEqual(failures.reasons, [
      { reason: 'failed-in-heic-convert: Error: ERR_LIBHEIF format not supported', files: 2 },
      { reason: 'worker-failed: Error: Workerpool Worker terminated Unexpectedly', files: 1 },
    ]);
  });

  it('should take paths out of the reason, as the worker sends what was thrown as it is', () => {
    const photo = path.join(os.homedir(), 'Pictures', 'Family trip', 'IMG_0001.HEIC');
    const failures = new ThumbnailFailures();
    failures.add('failed-to-read-src-file', `Error: ENOENT: no such file or directory, open '${photo}'`);

    const [{ reason }] = failures.reasons;
    assert.strictEqual(reason, "failed-to-read-src-file: Error: ENOENT: no such file or directory, open '<path>'");
    assert(!reason.includes(os.homedir()));
    assert(!reason.includes('Family trip'));
  });

  it('should give the status alone when the worker sent no error', () => {
    const failures = new ThumbnailFailures();
    failures.add('success');
    failures.add('unknown', '');

    assert.deepStrictEqual(failures.reasons, [{ reason: 'success', files: 1 }, { reason: 'unknown', files: 1 }]);
  });

  it(`should give at most ${maxRecordedReasons} reasons, the most frequent`, () => {
    const failures = new ThumbnailFailures();
    for (let i = 0; i < maxRecordedReasons + 3; i++) {
      for (let file = 0; file <= i; file++)
        failures.add('failed-in-heic-convert', `Error: reason ${i}`);
    }

    const reasons = failures.reasons;
    assert.strictEqual(reasons.length, maxRecordedReasons);
    assert.strictEqual(reasons[0].reason, `failed-in-heic-convert: Error: reason ${maxRecordedReasons + 2}`);
    assert.strictEqual(reasons[0].files, maxRecordedReasons + 3);
  });
});

describe('FailureReasons, which ThumbnailFailures is', () => {
  it('should describe what is neither an error nor a text by its type, as an unhandled error is', () => {
    class Event { public readonly isTrusted = true; }
    const failures = new ThumbnailFailures();
    failures.add('rotate-failed', new Event());
    failures.clear();
    failures.add('rotate-failed', new Event());

    assert.deepStrictEqual(failures.reasons, [{ reason: 'rotate-failed: Event: {"isTrusted":true}', files: 1 }]);
  });
});
