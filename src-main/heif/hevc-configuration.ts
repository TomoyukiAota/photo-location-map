import type { HevcConfiguration } from '../../src-shared/heif/heif-images.js';
import { HeifFormatError } from './heif-meta.js';

/**
 * What a decoder needs of an HEVC image's HEVCDecoderConfigurationRecord (the property hvcC, ISO/IEC 14496-15): the
 * codec string of WebCodecs, the record itself, and the size of the decoded picture.
 * TL;DR: The size is read from the sequence parameter set, as the coded picture may be larger than the image.
 * Details: Canon's and Sony's cameras code their thumbnails larger than the size that the file declares, and without
 * a conformance window that would crop them: 320x320 and 320x256 for images of 320x214 and 320x212, of which the image
 * is the top-left part. libheif refuses to decode them ("Decoded image does not have the size signaled in the file"),
 * so the HEIF file that is made for it declares the size of the picture, which is then cropped
 * (src-main/heif/embedded-thumbnail-worker.ts).
 */
export function hevcConfigurationOf(hvcC: Buffer): HevcConfiguration {
  if (hvcC.length < 23)
    throw new HeifFormatError('An HEVC configuration is too short.');
  const { width, height } = decodedSizeOf(hvcC);
  return { codec: codecStringOf(hvcC), description: new Uint8Array(hvcC), codedWidth: width, codedHeight: height };
}

/**
 * The codec string of an HEVC configuration, as WebCodecs' HEVC registration has it (ISO/IEC 14496-15, annex E):
 * `hvc1.<profile space><profile>.<compatibility flags, bits reversed>.<tier><level>[.<constraint bytes>]`, such as
 * `hvc1.3.E.L60.B0` for an iPhone's Main Still Picture.
 */
export function codecStringOf(hvcC: Buffer): string {
  const profileSpace = ['', 'A', 'B', 'C'][hvcC[1] >> 6];
  const tier = (hvcC[1] >> 5) & 1 ? 'H' : 'L';
  const profile = hvcC[1] & 31;
  let flags = hvcC.readUInt32BE(2);
  let reversed = 0;
  for (let bit = 0; bit < 32; bit++) {
    reversed = (reversed << 1) | (flags & 1);
    flags >>>= 1;
  }
  const constraints = [...hvcC.subarray(6, 12)];
  while (constraints.length > 0 && constraints[constraints.length - 1] === 0)
    constraints.pop();
  return ['hvc1', `${profileSpace}${profile}`, (reversed >>> 0).toString(16).toUpperCase(), `${tier}${hvcC[12]}`,
    ...constraints.map(byte => byte.toString(16).toUpperCase())].join('.');
}

/** The NAL units of an HEVC configuration's arrays, such as its parameter sets, by their type. */
function nalUnitsOf(hvcC: Buffer): { type: number, data: Buffer }[] {
  const units: { type: number, data: Buffer }[] = [];
  let position = 23;
  const arrayCount = hvcC[22];
  for (let i = 0; i < arrayCount; i++) {
    if (position + 3 > hvcC.length)
      throw new HeifFormatError('An HEVC configuration ends before its arrays.');
    const type = hvcC[position] & 0x3f;
    const count = hvcC.readUInt16BE(position + 1);
    position += 3;
    for (let j = 0; j < count; j++) {
      if (position + 2 > hvcC.length)
        throw new HeifFormatError('An HEVC configuration ends before its NAL units.');
      const length = hvcC.readUInt16BE(position);
      position += 2;
      if (position + length > hvcC.length)
        throw new HeifFormatError('An HEVC configuration ends inside a NAL unit.');
      units.push({ type, data: hvcC.subarray(position, position + length) });
      position += length;
    }
  }
  return units;
}

const spsNalUnitType = 33;

/** The bits of a NAL unit's payload, without its header and with the emulation prevention bytes taken out. */
class BitReader {
  private readonly bytes: number[] = [];
  private bit = 0;

  public constructor(nalUnit: Buffer) {
    let zeros = 0;
    for (const byte of nalUnit.subarray(2)) {
      if (zeros >= 2 && byte === 3) {
        zeros = 0;
        continue;
      }
      zeros = byte === 0 ? zeros + 1 : 0;
      this.bytes.push(byte);
    }
  }

  public bits(count: number): number {
    let value = 0;
    for (let i = 0; i < count; i++) {
      const byte = this.bytes[this.bit >> 3];
      if (byte === undefined)
        throw new HeifFormatError('A sequence parameter set ends early.');
      value = value * 2 + ((byte >> (7 - (this.bit & 7))) & 1);
      this.bit++;
    }
    return value;
  }

  /** An unsigned Exp-Golomb value, ue(v). */
  public exponentialGolomb(): number {
    let leadingZeros = 0;
    while (this.bits(1) === 0) {
      if (++leadingZeros > 31)
        throw new HeifFormatError('A sequence parameter set has a value out of range.');
    }
    return 2 ** leadingZeros - 1 + this.bits(leadingZeros);
  }
}

/**
 * The size of the decoded picture: the coded size less the conformance window, from the first sequence parameter set
 * (ITU-T H.265, 7.3.2.2), which is what a decoder outputs.
 */
function decodedSizeOf(hvcC: Buffer): { width: number, height: number } {
  const sps = nalUnitsOf(hvcC).find(unit => unit.type === spsNalUnitType);
  if (!sps)
    throw new HeifFormatError('An HEVC configuration has no sequence parameter set.');
  const reader = new BitReader(sps.data);
  reader.bits(4);  // sps_video_parameter_set_id
  const maxSubLayersMinus1 = reader.bits(3);
  reader.bits(1);  // sps_temporal_id_nesting_flag
  // profile_tier_level(1, sps_max_sub_layers_minus1): 96 bits of the general profile and level, then the sub-layers.
  reader.bits(32);
  reader.bits(32);
  reader.bits(32);
  const subLayerProfilePresent: boolean[] = [];
  const subLayerLevelPresent: boolean[] = [];
  for (let i = 0; i < maxSubLayersMinus1; i++) {
    subLayerProfilePresent.push(reader.bits(1) === 1);
    subLayerLevelPresent.push(reader.bits(1) === 1);
  }
  if (maxSubLayersMinus1 > 0) {
    for (let i = maxSubLayersMinus1; i < 8; i++)
      reader.bits(2);
  }
  for (let i = 0; i < maxSubLayersMinus1; i++) {
    if (subLayerProfilePresent[i]) {
      reader.bits(32);
      reader.bits(32);
      reader.bits(24);
    }
    if (subLayerLevelPresent[i])
      reader.bits(8);
  }
  reader.exponentialGolomb();  // sps_seq_parameter_set_id
  const chromaFormat = reader.exponentialGolomb();
  const separateColourPlanes = chromaFormat === 3 && reader.bits(1) === 1;
  const codedWidth = reader.exponentialGolomb();
  const codedHeight = reader.exponentialGolomb();
  let width = codedWidth, height = codedHeight;
  if (reader.bits(1) === 1) {  // conformance_window_flag
    const [subWidth, subHeight] = separateColourPlanes ? [1, 1] : ([[1, 1], [2, 2], [2, 1], [1, 1]][chromaFormat] ?? [1, 1]);
    const left = reader.exponentialGolomb(), right = reader.exponentialGolomb();
    const top = reader.exponentialGolomb(), bottom = reader.exponentialGolomb();
    width -= subWidth * (left + right);
    height -= subHeight * (top + bottom);
  }
  if (width <= 0 || height <= 0 || width > 65536 || height > 65536)
    throw new HeifFormatError(`A sequence parameter set has a picture of ${width}x${height}.`);
  return { width, height };
}
