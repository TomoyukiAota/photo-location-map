// TL;DR: Reads the `meta` box of a HEIF file (ISO/IEC 23008-12): its items, how they refer to each other, their
// properties and where their data are, which is all that the app needs to find a photo's thumbnail item and the tiles
// of its primary image.
// Details: A file of 12 megapixels from an iPhone has 50 to 60 items: the grid of the primary image, its 48 tiles, the
// thumbnail, the Exif, often XMP, an HDR gain map, depth and mattes. Only the boxes below are read; every other box is
// skipped by its size. Every size and offset is checked against the box that holds it, so that a broken or truncated
// file throws a HeifFormatError, which the callers take as a file whose images the page cannot decode.

/** A HEIF file that cannot be read as the app reads one. */
export class HeifFormatError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'HeifFormatError';
  }
}

export interface Box {
  readonly type: string;
  /** Where the box starts, where its contents start (after the size and type), and where it ends. */
  readonly start: number;
  readonly content: number;
  readonly end: number;
}

/** The boxes in `buffer` from `start` to `end`, each checked to fit; a box that does not fit ends the list. */
export function* boxesIn(buffer: Buffer, start: number, end: number): Generator<Box> {
  let position = start;
  while (position + 8 <= end) {
    let size = buffer.readUInt32BE(position);
    const type = buffer.toString('latin1', position + 4, position + 8);
    let header = 8;
    if (size === 1) {
      if (position + 16 > end)
        return;
      size = Number(buffer.readBigUInt64BE(position + 8));
      header = 16;
    } else if (size === 0) {
      size = end - position;
    }
    if (size < header || position + size > end)
      return;
    yield { type, start: position, content: position + header, end: position + size };
    position += size;
  }
}

/** Reads the fields of a box, each checked to be within it. */
class FieldReader {
  public constructor(private readonly buffer: Buffer, public position: number, private readonly end: number) {}

  public uint(bytes: number): number {
    if (bytes === 0)
      return 0;
    if (this.position + bytes > this.end)
      throw new HeifFormatError('A box ends before its fields.');
    let value: number;
    switch (bytes) {
      case 1: value = this.buffer.readUInt8(this.position); break;
      case 2: value = this.buffer.readUInt16BE(this.position); break;
      case 3: value = this.buffer.readUIntBE(this.position, 3); break;
      case 4: value = this.buffer.readUInt32BE(this.position); break;
      case 8: value = Number(this.buffer.readBigUInt64BE(this.position)); break;
      default: throw new HeifFormatError(`A field of ${bytes} bytes is not one of HEIF's.`);
    }
    this.position += bytes;
    return value;
  }

  public fourcc(): string {
    if (this.position + 4 > this.end)
      throw new HeifFormatError('A box ends before its fields.');
    const value = this.buffer.toString('latin1', this.position, this.position + 4);
    this.position += 4;
    return value;
  }

  public skip(bytes: number): void {
    this.position += bytes;
    if (this.position > this.end)
      throw new HeifFormatError('A box ends before its fields.');
  }
}

/** Where an item's data are: in the file, or in the `idat` box of `meta` (construction method 1). */
export interface ItemLocation {
  readonly inIdat: boolean;
  /** Offsets in the file, or in the contents of `idat`, with lengths. */
  readonly extents: ReadonlyArray<{ readonly offset: number, readonly length: number }>;
}

export interface ItemReference {
  readonly type: string;
  readonly from: number;
  readonly to: readonly number[];
}

/** The properties that the app reads, of one item. */
export interface ItemProperties {
  /** The image's size (ispe). */
  readonly width?: number;
  readonly height?: number;
  /** The HEVCDecoderConfigurationRecord (hvcC). */
  readonly hvcC?: Buffer;
  /** Turned anti-clockwise by this many degrees (irot). */
  readonly rotation?: 0 | 90 | 180 | 270;
  /** Mirrored about a vertical (0) or horizontal (1) axis (imir). */
  readonly mirror?: 0 | 1;
  /** The clean aperture (clap): numerators and denominators of its width, height and offsets. */
  readonly clap?: readonly number[];
}

export interface HeifMeta {
  readonly primaryItemId: number;
  /** The type of each item, such as `hvc1`, `grid`, `jpeg` or `Exif`, by its id. */
  readonly itemTypes: ReadonlyMap<number, string>;
  readonly references: readonly ItemReference[];
  readonly locations: ReadonlyMap<number, ItemLocation>;
  /** The contents of `idat`, in the buffer that the meta box was read from. */
  readonly idat?: { readonly start: number, readonly end: number };
  propertiesOf(itemId: number): ItemProperties;
}

/** Reads the contents of a `meta` box, `buffer[start, end)`, which starts with its version and flags. */
export function parseHeifMeta(buffer: Buffer, start: number, end: number): HeifMeta {
  let primaryItemId: number | undefined;
  const itemTypes = new Map<number, string>();
  const references: ItemReference[] = [];
  const properties: Box[] = [];
  const associations = new Map<number, number[]>();
  const locations = new Map<number, ItemLocation>();
  let idat: { start: number, end: number } | undefined;

  for (const box of boxesIn(buffer, start + 4, end)) {
    const fields = new FieldReader(buffer, box.content, box.end);
    switch (box.type) {
      case 'pitm': {
        const version = fields.uint(1);
        fields.skip(3);
        primaryItemId = fields.uint(version === 0 ? 2 : 4);
        break;
      }
      case 'iinf': {
        const version = fields.uint(1);
        fields.skip(3);
        fields.uint(version === 0 ? 2 : 4);
        for (const entry of boxesIn(buffer, fields.position, box.end)) {
          if (entry.type !== 'infe')
            continue;
          const entryFields = new FieldReader(buffer, entry.content, entry.end);
          const entryVersion = entryFields.uint(1);
          entryFields.skip(3);
          if (entryVersion < 2)
            continue;  // Versions 0 and 1 have no item type: not an image's item.
          const itemId = entryFields.uint(entryVersion === 2 ? 2 : 4);
          entryFields.skip(2);  // item_protection_index
          itemTypes.set(itemId, entryFields.fourcc());
        }
        break;
      }
      case 'iref': {
        const version = fields.uint(1);
        fields.skip(3);
        const idBytes = version === 0 ? 2 : 4;
        for (const reference of boxesIn(buffer, fields.position, box.end)) {
          const referenceFields = new FieldReader(buffer, reference.content, reference.end);
          const from = referenceFields.uint(idBytes);
          const count = referenceFields.uint(2);
          const to: number[] = [];
          for (let i = 0; i < count; i++)
            to.push(referenceFields.uint(idBytes));
          references.push({ type: reference.type, from, to });
        }
        break;
      }
      case 'iprp':
        for (const child of boxesIn(buffer, box.content, box.end)) {
          if (child.type === 'ipco') {
            properties.push(...boxesIn(buffer, child.content, child.end));
          } else if (child.type === 'ipma') {
            const ipma = new FieldReader(buffer, child.content, child.end);
            const version = ipma.uint(1);
            const flags = ipma.uint(3);
            const count = ipma.uint(4);
            for (let i = 0; i < count; i++) {
              const itemId = ipma.uint(version < 1 ? 2 : 4);
              const associationCount = ipma.uint(1);
              const indexes: number[] = [];
              for (let j = 0; j < associationCount; j++)
                indexes.push(flags & 1 ? ipma.uint(2) & 0x7fff : ipma.uint(1) & 0x7f);
              associations.set(itemId, [...(associations.get(itemId) ?? []), ...indexes]);
            }
          }
        }
        break;
      case 'iloc': {
        const version = fields.uint(1);
        fields.skip(3);
        const sizes = fields.uint(1);
        const offsetSize = sizes >> 4, lengthSize = sizes & 15;
        const moreSizes = fields.uint(1);
        const baseOffsetSize = moreSizes >> 4;
        const indexSize = version === 1 || version === 2 ? moreSizes & 15 : 0;
        const count = fields.uint(version < 2 ? 2 : 4);
        for (let i = 0; i < count; i++) {
          const itemId = fields.uint(version < 2 ? 2 : 4);
          const constructionMethod = version === 1 || version === 2 ? fields.uint(2) & 15 : 0;
          fields.skip(2);  // data_reference_index
          const baseOffset = fields.uint(baseOffsetSize);
          const extentCount = fields.uint(2);
          const extents: { offset: number, length: number }[] = [];
          for (let j = 0; j < extentCount; j++) {
            fields.uint(indexSize);
            const offset = fields.uint(offsetSize);
            const length = fields.uint(lengthSize);
            extents.push({ offset: baseOffset + offset, length });
          }
          // Method 2, an item's data taken from another item, is not used by the images that the app reads.
          if (constructionMethod <= 1)
            locations.set(itemId, { inIdat: constructionMethod === 1, extents });
        }
        break;
      }
      case 'idat':
        idat = { start: box.content, end: box.end };
        break;
    }
  }

  if (primaryItemId === undefined)
    throw new HeifFormatError('The file has no primary item.');

  return {
    primaryItemId,
    itemTypes,
    references,
    locations,
    idat,
    propertiesOf: itemId => propertiesOf(buffer, properties, associations.get(itemId) ?? []),
  };
}

function propertiesOf(buffer: Buffer, properties: readonly Box[], indexes: readonly number[]): ItemProperties {
  const found: { -readonly [K in keyof ItemProperties]: ItemProperties[K] } = {};
  for (const index of indexes) {
    const property = properties[index - 1];  // Index 0 means no property.
    if (!property)
      continue;
    const fields = new FieldReader(buffer, property.content, property.end);
    switch (property.type) {
      case 'ispe':
        fields.skip(4);
        found.width = fields.uint(4);
        found.height = fields.uint(4);
        break;
      case 'hvcC':
        found.hvcC = buffer.subarray(property.content, property.end);
        break;
      case 'irot':
        found.rotation = ((fields.uint(1) & 3) * 90) as 0 | 90 | 180 | 270;
        break;
      case 'imir':
        found.mirror = (fields.uint(1) & 1) as 0 | 1;
        break;
      case 'clap':
        found.clap = Array.from({ length: 8 }, () => fields.uint(4) | 0);  // Signed numerators of offsets.
        break;
    }
  }
  return found;
}

/** The items that refer to `itemId` with a reference of `type`, such as `thmb`. */
export function itemsReferringTo(meta: HeifMeta, type: string, itemId: number): number[] {
  return meta.references.filter(reference => reference.type === type && reference.to.includes(itemId))
    .map(reference => reference.from);
}

/** The items that `itemId` refers to with a reference of `type`, in their order, such as the tiles of a grid (`dimg`). */
export function itemsReferredFrom(meta: HeifMeta, type: string, itemId: number): readonly number[] {
  return meta.references.find(reference => reference.type === type && reference.from === itemId)?.to ?? [];
}

/**
 * The part of an image of `width` x `height` that its clean aperture keeps (ISO/IEC 14496-12, clap): centred on the
 * image's centre moved by the offsets, rounded to whole pixels and kept within the image.
 */
export function cleanApertureOf(clap: readonly number[], width: number, height: number):
  { x: number, y: number, width: number, height: number } {
  const [widthN, widthD, heightN, heightD, horizontalN, horizontalD, verticalN, verticalD] = clap;
  if (!widthD || !heightD || !horizontalD || !verticalD)
    throw new HeifFormatError('A clean aperture divides by zero.');
  const apertureWidth = (widthN >>> 0) / (widthD >>> 0);
  const apertureHeight = (heightN >>> 0) / (heightD >>> 0);
  const left = horizontalN / (horizontalD >>> 0) + (width - 1) / 2 - (apertureWidth - 1) / 2;
  const top = verticalN / (verticalD >>> 0) + (height - 1) / 2 - (apertureHeight - 1) / 2;
  const x = Math.min(Math.max(0, Math.round(left)), width - 1);
  const y = Math.min(Math.max(0, Math.round(top)), height - 1);
  return {
    x,
    y,
    width: Math.max(1, Math.min(Math.round(apertureWidth), width - x)),
    height: Math.max(1, Math.min(Math.round(apertureHeight), height - y)),
  };
}
