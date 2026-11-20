import { bestFaceScore, bgrPlanesOf, faceScoreThreshold, letterboxScale, YunetOutputs, yunetInputSize } from './yunet';

/** YuNet's outputs for a square input of `size`, all anchors scoring 0 but those given, by stride and index. */
function outputsWith(scores: { stride: 8 | 16 | 32; index: number; cls: number; obj: number }[], size = yunetInputSize): YunetOutputs {
  const outputs: Record<string, { data: Float32Array }> = {};
  for (const stride of [8, 16, 32]) {
    const anchors = (size / stride) ** 2;
    outputs[`cls_${stride}`] = { data: new Float32Array(anchors) };
    outputs[`obj_${stride}`] = { data: new Float32Array(anchors) };
    outputs[`bbox_${stride}`] = { data: new Float32Array(anchors * 4) };
    outputs[`kps_${stride}`] = { data: new Float32Array(anchors * 10) };
  }
  for (const { stride, index, cls, obj } of scores) {
    outputs[`cls_${stride}`].data[index] = cls;
    outputs[`obj_${stride}`].data[index] = obj;
  }
  return outputs;
}

describe('YuNet', () => {
  it('takes a square input of 640 pixels, and a face from a score of 0.8', () => {
    expect(yunetInputSize).toBe(640);
    expect(faceScoreThreshold).toBe(0.8);
  });

  it('fills its input with an image as large as fits, keeping its shape, enlarging a smaller one', () => {
    expect(letterboxScale(640, 480)).toBe(1);
    expect(letterboxScale(480, 640)).toBe(1);
    expect(letterboxScale(1280, 960)).toBe(0.5);
    expect(letterboxScale(400, 300)).toBe(1.6);
    expect(letterboxScale(160, 120)).toBe(4);
  });

  it('takes the pixels as planes of blue, green and red, from 0 to 255, without their alpha', () => {
    // A square of 2 by 2 pixels: red, green, blue, and a grey that is half transparent.
    const rgba = [255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 10, 20, 30, 128];
    expect([...bgrPlanesOf(rgba, 2)]).toEqual([
      0, 0, 255, 30, // Blue.
      0, 255, 0, 20, // Green.
      255, 0, 0, 10, // Red.
    ]);
  });

  it('scores a face as the square root of its classification times its objectness, each clamped to 0 to 1', () => {
    expect(bestFaceScore(outputsWith([]))).toBe(0);
    expect(bestFaceScore(outputsWith([{ stride: 8, index: 100, cls: 0.81, obj: 1 }]))).toBeCloseTo(0.9);
    expect(bestFaceScore(outputsWith([{ stride: 32, index: 0, cls: 0.64, obj: 1.5 }]))).toBeCloseTo(0.8);
    expect(bestFaceScore(outputsWith([{ stride: 16, index: 5, cls: -0.2, obj: 0.9 }]))).toBe(0);
  });

  it('gives the best score of all three strides', () => {
    const outputs = outputsWith([
      { stride: 8, index: 6399, cls: 0.25, obj: 1 },
      { stride: 16, index: 3, cls: 0.49, obj: 1 },
      { stride: 32, index: 399, cls: 0.36, obj: 1 },
    ]);
    expect(bestFaceScore(outputs)).toBeCloseTo(0.7);
  });
});
