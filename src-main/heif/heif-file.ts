import * as fs from 'fs';
import type { FileHandle } from 'fs/promises';
import type { HeifEmbeddedThumbnail, HeifTransformations, HeifWholeImage } from '../../src-shared/heif/heif-images.js';
import { cleanApertureOf, HeifFormatError, HeifMeta, ItemProperties, itemsReferredFrom, itemsReferringTo, parseHeifMeta } from './heif-meta.js';
import { hevcConfigurationOf } from './hevc-configuration.js';

// TL;DR: Reads what the page decodes of a HEIF file: the thumbnail item of its primary image, or the tiles of the
// primary image, with as little of the file as they need.
// Details:
// - The first read takes the file's first 64 KB. An iPhone puts the `meta` box (4 KB, 34 KB at most among the
//   photos measured) at the start and the thumbnail right after it (brand MiPr), so that 93% of its photos need no
//   other read; a thumbnail that ends further is read on its own. A Samsung phone puts `meta` after `mdat`, at the
//   end of the file: the headers of the top-level boxes lead to it.
// - The limits below keep a broken file from making the main process allocate what the file's sizes claim.

const firstReadBytes = 64 * 1024;
const maxMetaBytes = 16 * 1024 * 1024;
const maxTopLevelBoxes = 64;
const maxThumbnailBytes = 16 * 1024 * 1024;
const maxWholeImageBytes = 256 * 1024 * 1024;
const maxTiles = 4096;
/** The thumbnail chosen is the smallest whose longer side has this many pixels, so that it fills its place. */
const thumbnailLongerSide = 320;

interface OpenedHeif {
  readonly handle: FileHandle;
  readonly fileSize: number;
  /** The first bytes of the file. */
  readonly head: Buffer;
  /** The buffer that holds the `meta` box: `head`, or one read for it. */
  readonly metaBuffer: Buffer;
  readonly meta: HeifMeta;
}

async function readAt(handle: FileHandle, position: number, length: number): Promise<Buffer> {
  const buffer = Buffer.alloc(length);
  let done = 0;
  while (done < length) {
    const { bytesRead } = await handle.read(buffer, done, length - done, position + done);
    if (bytesRead === 0)
      throw new HeifFormatError('The file ends before what its boxes say.');
    done += bytesRead;
  }
  return buffer;
}

/** Opens a HEIF file and reads its `meta` box; closes the file and throws when it is not one that can be read. */
async function openHeif(filePath: string): Promise<OpenedHeif> {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const { size: fileSize } = await handle.stat();
    const head = await readAt(handle, 0, Math.min(firstReadBytes, fileSize));
    if (head.length < 16 || head.toString('latin1', 4, 8) !== 'ftyp')
      throw new HeifFormatError('The file does not start with ftyp.');

    let position = 0;
    for (let boxes = 0; boxes < maxTopLevelBoxes && position + 8 <= fileSize; boxes++) {
      const header = position + 16 <= head.length ? head.subarray(position, position + 16)
        : await readAt(handle, position, Math.min(16, fileSize - position));
      let size = header.readUInt32BE(0);
      const type = header.toString('latin1', 4, 8);
      if (size === 1 && header.length >= 16)
        size = Number(header.readBigUInt64BE(8));
      else if (size === 0)
        size = fileSize - position;
      if (size < 8 || position + size > fileSize)
        throw new HeifFormatError(`The box ${type} does not fit in the file.`);
      if (type === 'meta') {
        if (size > maxMetaBytes)
          throw new HeifFormatError(`The meta box has ${size} bytes.`);
        const inHead = position + size <= head.length;
        const metaBuffer = inHead ? head : await readAt(handle, position, size);
        const metaStart = inHead ? position : 0;
        const meta = parseHeifMeta(metaBuffer, metaStart + 8, metaStart + size);
        return { handle, fileSize, head, metaBuffer, meta };
      }
      position += size;
    }
    throw new HeifFormatError('The file has no meta box.');
  } catch (error) {
    await handle.close();
    throw error;
  }
}

/** The data of an item: from `idat`, from the first read, or read from the file. */
async function itemData(heif: OpenedHeif, itemId: number, maxBytes: number): Promise<Buffer> {
  const location = heif.meta.locations.get(itemId);
  if (!location || location.extents.length === 0)
    throw new HeifFormatError(`The item ${itemId} has no data.`);
  const total = location.extents.reduce((sum, extent) => sum + extent.length, 0);
  if (total > maxBytes)
    throw new HeifFormatError(`The item ${itemId} has ${total} bytes.`);
  const parts: Buffer[] = [];
  for (const { offset, length } of location.extents) {
    if (location.inIdat) {
      const idat = heif.meta.idat;
      if (!idat || idat.start + offset + length > idat.end)
        throw new HeifFormatError(`The item ${itemId} is not within idat.`);
      parts.push(heif.metaBuffer.subarray(idat.start + offset, idat.start + offset + length));
    } else if (offset + length > heif.fileSize) {
      throw new HeifFormatError(`The item ${itemId} is not within the file.`);
    } else if (offset + length <= heif.head.length) {
      parts.push(heif.head.subarray(offset, offset + length));
    } else {
      parts.push(await readAt(heif.handle, offset, length));
    }
  }
  return parts.length === 1 ? parts[0] : Buffer.concat(parts);
}

/** The transformations of an image of the declared size `width` x `height`. */
function transformationsOf(properties: ItemProperties, width: number, height: number): HeifTransformations {
  return {
    crop: properties.clap ? cleanApertureOf(properties.clap, width, height) : { x: 0, y: 0, width, height },
    rotation: properties.rotation ?? 0,
    ...(properties.mirror !== undefined ? { mirror: properties.mirror } : {}),
  };
}

/**
 * The thumbnail item of the file's primary image that the page shows: the smallest whose longer side has 320 pixels,
 * else the largest; a JPEG before an HEVC image of its size, as it needs no decoding. Null when the file has none
 * that the page can show.
 */
export async function readEmbeddedThumbnail(filePath: string): Promise<HeifEmbeddedThumbnail | null> {
  const heif = await openHeif(filePath);
  try {
    const { meta } = heif;
    const candidates = itemsReferringTo(meta, 'thmb', meta.primaryItemId)
      .map(itemId => ({ itemId, type: meta.itemTypes.get(itemId), properties: meta.propertiesOf(itemId) }))
      .filter(({ type, properties }) => properties.width > 0 && properties.height > 0
        && (type === 'jpeg' || (type === 'hvc1' && properties.hvcC)))
      .map(candidate => ({ ...candidate, longerSide: Math.max(candidate.properties.width, candidate.properties.height) }))
      .sort((a, b) => a.longerSide - b.longerSide || (a.type === 'jpeg' ? -1 : 1));
    const chosen = candidates.find(candidate => candidate.longerSide >= thumbnailLongerSide) ?? candidates[candidates.length - 1];
    if (!chosen)
      return null;

    const { itemId, type, properties } = chosen;
    const transformations = transformationsOf(properties, properties.width, properties.height);
    const data = new Uint8Array(await itemData(heif, itemId, maxThumbnailBytes));
    if (type === 'jpeg')
      return { kind: 'jpeg', data, ...transformations };
    return { kind: 'hevc', hevc: hevcConfigurationOf(properties.hvcC), data, ...transformations };
  } finally {
    await heif.handle.close();
  }
}

/**
 * The primary image as its HEVC tiles: a grid, as cameras and phones code a large image, or one picture. Null when
 * it is coded otherwise, which the page cannot decode, such as a gain map's derived image (tmap) or AV1.
 */
export async function readWholeImage(filePath: string): Promise<HeifWholeImage | null> {
  const heif = await openHeif(filePath);
  try {
    const { meta } = heif;
    const primary = meta.primaryItemId;
    const primaryType = meta.itemTypes.get(primary);
    const primaryProperties = meta.propertiesOf(primary);

    let tileIds: readonly number[];
    let rows = 1, columns = 1, width: number, height: number;
    if (primaryType === 'grid') {
      // ImageGrid (ISO/IEC 23008-12, 6.6.2.3): version, flags (bit 0: 32-bit sizes), rows - 1, columns - 1, size.
      const grid = await itemData(heif, primary, 64);
      const large = (grid[1] & 1) === 1;
      if (grid.length < (large ? 12 : 8))
        throw new HeifFormatError('The grid is too short.');
      rows = grid[2] + 1;
      columns = grid[3] + 1;
      width = large ? grid.readUInt32BE(4) : grid.readUInt16BE(4);
      height = large ? grid.readUInt32BE(8) : grid.readUInt16BE(6);
      tileIds = itemsReferredFrom(meta, 'dimg', primary);
      if (tileIds.length !== rows * columns || tileIds.length > maxTiles)
        throw new HeifFormatError(`The grid of ${rows}x${columns} has ${tileIds.length} tiles.`);
    } else if (primaryType === 'hvc1') {
      tileIds = [primary];
      width = primaryProperties.width;
      height = primaryProperties.height;
    } else {
      return null;
    }

    const tileProperties = tileIds.map(tileId => ({ type: meta.itemTypes.get(tileId), ...meta.propertiesOf(tileId) }));
    const first = tileProperties[0];
    if (!first?.hvcC || !(first.width > 0) || !(first.height > 0) || !(width > 0) || !(height > 0))
      return null;
    // One VideoDecoder decodes every tile: they share one configuration and one size, as in every file seen.
    if (tileProperties.some(tile => tile.type !== 'hvc1' || !tile.hvcC?.equals(first.hvcC)
      || tile.width !== first.width || tile.height !== first.height))
      return null;
    if (columns * first.width < width || rows * first.height < height)
      throw new HeifFormatError('The tiles do not cover the grid.');

    const tiles = await tileData(heif, tileIds);
    return {
      hevc: hevcConfigurationOf(first.hvcC),
      tileWidth: first.width,
      tileHeight: first.height,
      rows,
      columns,
      tiles,
      ...transformationsOf(primaryProperties, width, height),
    };
  } finally {
    await heif.handle.close();
  }
}

/** The data of the tiles, read at once when they lie together in the file, as they do in a camera's file. */
async function tileData(heif: OpenedHeif, tileIds: readonly number[]): Promise<Uint8Array[]> {
  const locations = tileIds.map(tileId => heif.meta.locations.get(tileId));
  const extents = locations.flatMap(location => location && !location.inIdat ? location.extents : []);
  if (locations.some(location => !location || location.inIdat || location.extents.length === 0))
    return Promise.all(tileIds.map(async tileId => new Uint8Array(await itemData(heif, tileId, maxWholeImageBytes))));

  const start = Math.min(...extents.map(extent => extent.offset));
  const end = Math.max(...extents.map(extent => extent.offset + extent.length));
  if (end > heif.fileSize)
    throw new HeifFormatError('A tile is not within the file.');
  if (end - start > maxWholeImageBytes)
    throw new HeifFormatError(`The tiles span ${end - start} bytes.`);
  const span = await readAt(heif.handle, start, end - start);
  return locations.map(location => {
    const parts = location.extents.map(({ offset, length }) => span.subarray(offset - start, offset - start + length));
    return new Uint8Array(parts.length === 1 ? parts[0] : Buffer.concat(parts));
  });
}
