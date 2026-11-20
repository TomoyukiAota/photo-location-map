/**
 * YuNet, OpenCV's face detector (src/assets/face-search/README.md): what its input is, and how a face's score is read
 * from its outputs, as OpenCV's FaceDetectorYN reads them. Apart from the worker that runs it
 * (face-detection.worker.ts), so that the unit tests reach it.
 */

/** The side of YuNet's square input: the model was exported with a fixed input of 640 by 640 pixels. */
export const yunetInputSize = 640;

/**
 * The score from which a face counts as found.
 * TL;DR: 0.8, from a test of 71 photos: 31 of the 32 with faces were found, and 2 of the 39 without had a face found.
 * Details: OpenCV's samples take 0.9, which found 18 of the 32: the faces of people farther away, as in a group or a
 * crowd, scored from 0.8 to 0.9. Below 0.8, more photos without a face had one found: at 0.6, 4 of the 39. Those
 * found at 0.8 were a dog's face and a tattoo of a statue's face; the face missed was behind a mask and sunglasses
 * (docs/tasks/20261121_face-search/STATUS.md).
 */
export const faceScoreThreshold = 0.8;

/** The strides of YuNet's three outputs, each a grid of anchors over the input, finer for smaller faces. */
const strides = [8, 16, 32] as const;

/**
 * How much an image of `width` by `height` is scaled to fill YuNet's input, keeping its shape: a smaller image, as a
 * HEIF photo's thumbnail of 400 pixels, is enlarged, which makes its faces large enough for the model's finest grid,
 * as in the test of the threshold (faceScoreThreshold).
 */
export function letterboxScale(width: number, height: number, size = yunetInputSize): number {
  return Math.min(size / width, size / height);
}

/**
 * The pixels of a square image of `size` by `size`, as a canvas gives them (red, green, blue and alpha), in the order
 * that YuNet takes them: a plane of blue, one of green and one of red, from 0 to 255, as OpenCV's blobFromImage makes
 * them of an image of OpenCV, which is blue, green and red.
 */
export function bgrPlanesOf(rgba: ArrayLike<number>, size = yunetInputSize): Float32Array {
  const pixels = size * size;
  const planes = new Float32Array(3 * pixels);
  for (let pixel = 0, index = 0; pixel < pixels; pixel++, index += 4) {
    planes[pixel] = rgba[index + 2];
    planes[pixels + pixel] = rgba[index + 1];
    planes[2 * pixels + pixel] = rgba[index];
  }
  return planes;
}

/** YuNet's outputs by their names, as ONNX Runtime gives them: cls_8, obj_8, bbox_8, kps_8, and so on for 16 and 32. */
export type YunetOutputs = Readonly<Record<string, { readonly data: ArrayLike<number> }>>;

function clampToUnit(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * The highest score of a face in YuNet's outputs, or 0 when none: each anchor's score is the square root of its
 * classification score times its objectness score, each clamped to 0 to 1, as FaceDetectorYN computes it. Where the
 * faces are does not matter here: a photo has a face or does not.
 */
export function bestFaceScore(outputs: YunetOutputs): number {
  let best = 0;
  for (const stride of strides) {
    const classification = outputs[`cls_${stride}`].data;
    const objectness = outputs[`obj_${stride}`].data;
    for (let index = 0; index < classification.length; index++)
      best = Math.max(best, Math.sqrt(clampToUnit(classification[index]) * clampToUnit(objectness[index])));
  }
  return best;
}
