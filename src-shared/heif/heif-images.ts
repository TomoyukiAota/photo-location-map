// What the main process reads of a HEIF file's images for the page, which decodes them itself
// (src-main/heif/, src/app/heif-thumbnail/), as plain data that IPC copies.

/**
 * How an image is turned, in the order that MIAF has them applied: cropped to `crop`, then turned anti-clockwise by
 * `rotation` degrees (the property irot), then mirrored (imir): 0 about a vertical axis, which swaps left and right,
 * 1 about a horizontal axis.
 * TL;DR: These, not the EXIF orientation: the file's own properties, which say the same as its EXIF does.
 */
export interface HeifTransformations {
  /**
   * The part of the decoded picture that is the image: the size that the file declares (ispe), from its top-left
   * corner, as the coded picture may be larger (Canon's and Sony's thumbnails), or the clean aperture (clap).
   */
  readonly crop: { readonly x: number, readonly y: number, readonly width: number, readonly height: number };
  readonly rotation: 0 | 90 | 180 | 270;
  readonly mirror?: 0 | 1;
}

/** The HEVC decoder configuration of an image: what WebCodecs' VideoDecoder is configured with. */
export interface HevcConfiguration {
  /** The codec string of WebCodecs, such as `hvc1.3.E.L60.B0`, of the HEVCDecoderConfigurationRecord. */
  readonly codec: string;
  /** The HEVCDecoderConfigurationRecord (the property hvcC), with the parameter sets. */
  readonly description: Uint8Array;
  /** The size of the coded picture, from the sequence parameter set, which may be larger than the image. */
  readonly codedWidth: number;
  readonly codedHeight: number;
}

/**
 * The small image that a HEIF file keeps of its primary image, the item with a `thmb` reference to it: 320x240 for an
 * iPhone's photo of 12 megapixels, 416x312 for 24, 576x432 for 48.
 */
export type HeifEmbeddedThumbnail = HeifTransformations & (
  | {
    readonly kind: 'hevc';
    readonly hevc: HevcConfiguration;
    /** The coded picture, as length-prefixed NAL units, which a VideoDecoder decodes as one key chunk. */
    readonly data: Uint8Array;
  }
  /** A JPEG, as Sony's cameras keep one, which the page shows as it is. */
  | { readonly kind: 'jpeg', readonly data: Uint8Array }
);

/**
 * The primary image of a HEIF file, as the tiles that it is coded in: a grid of HEVC pictures, 512x512 in an iPhone's
 * photo, or one picture. Each tile's top-left `tileWidth` x `tileHeight` goes in its place of the grid, row by row,
 * and `crop` is the image's part of the grid: the grid's output size, from its top-left corner.
 */
export interface HeifWholeImage extends HeifTransformations {
  readonly hevc: HevcConfiguration;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly rows: number;
  readonly columns: number;
  /** The coded pictures of the tiles, row by row, each as length-prefixed NAL units. */
  readonly tiles: readonly Uint8Array[];
}
