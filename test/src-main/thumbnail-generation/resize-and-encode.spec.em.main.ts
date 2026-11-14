import assert from 'assert';
import { createHash } from 'crypto';
import { resizeAndEncode } from '../../../src-main/thumbnail-generation/resize-and-encode.js';

// Captured with original Jimp 0.16.2 and jpeg-js 0.4.4; never derived from the upgraded helper.
const references = [
  {
    "width": 800,
    "height": 600,
    "outputWidth": 400,
    "outputHeight": 300,
    "jpegSha256": "a826a0b0fc565f61d46a7a30510d9adfa3d152f6c83d74705f3b1d98b8f12ec6"
  },
  {
    "width": 3,
    "height": 7,
    "outputWidth": 171,
    "outputHeight": 400,
    "jpegSha256": "4bc79d81f80c42767812a48902043eeee9be6d192b10571ea52604423b55dbc5"
  },
  {
    "width": 127,
    "height": 91,
    "outputWidth": 400,
    "outputHeight": 287,
    "jpegSha256": "eb1a9a81cdef910cd40f0fe2cc0ddca27481fd7e76ebe49a23df209c45d2db6c"
  },
  {
    "width": 400,
    "height": 400,
    "outputWidth": 400,
    "outputHeight": 400,
    "jpegSha256": "1090d89084da3d03ac957fe65271837bf3d66cbfd2e163452debaf45b044628c"
  }
];

describe('Thumbnail resize and JPEG compatibility', () => {
  for (const sample of references) {
    it(`preserves the original ${sample.width}x${sample.height} result with a nonzero buffer offset`, () => {
      const { width, height } = sample;
      const data = Buffer.alloc(width * height * 4 + 29, 211).subarray(29);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          data[index] = (x * 17 + y * 7) % 256;
          data[index + 1] = (x * 5 + y * 19) % 256;
          data[index + 2] = (x * 11 + y * 3) % 256;
          data[index + 3] = (x + y) % 3 ? 255 : 64;
        }
      }
      const result = resizeAndEncode({ width, height, data }, 92);
      assert.equal(result.width, sample.outputWidth);
      assert.equal(result.height, sample.outputHeight);
      assert.equal(createHash('sha256').update(result.data).digest('hex'), sample.jpegSha256);
    });
  }
});
