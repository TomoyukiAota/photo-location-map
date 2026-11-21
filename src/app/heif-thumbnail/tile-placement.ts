import type { HeifWholeImage } from '../../../src-shared/heif/heif-images.js';

/** A rectangle of whole pixels. */
export interface PixelRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where a tile is drawn: the part of the tile that the image shows (`source`), and its pixels on the canvas. */
export interface TilePlacement {
  source: PixelRectangle;
  destination: PixelRectangle;
}

/** Along one side of the image: the part of each tile that the image shows, and the pixels of the canvas it fills. */
interface Span {
  sourceStart: number;
  sourceSize: number;
  destinationStart: number;
  destinationSize: number;
}

function spans(tileSize: number, count: number, cropStart: number, cropSize: number, canvasSize: number): Array<Span | null> {
  // The edges of the image map to the canvas's own, and every other edge to a whole pixel.
  const pixelAt = (position: number) => Math.round((position - cropStart) * canvasSize / cropSize);
  return Array.from({ length: count }, (_, index) => {
    const start = Math.max(index * tileSize, cropStart);
    const end = Math.min((index + 1) * tileSize, cropStart + cropSize);
    if (start >= end)
      return null;
    const destinationStart = pixelAt(start);
    const destinationSize = pixelAt(end) - destinationStart;
    if (destinationSize === 0)
      return null;
    return { sourceStart: start - index * tileSize, sourceSize: end - start, destinationStart, destinationSize };
  });
}

/**
 * Where each tile of `image`, by row then column, is drawn on a canvas of `width` x `height` that shows the whole
 * image: the part of the tile within the image, into whole pixels of the canvas, whose edges the next tile shares;
 * null for a tile that the image does not show, or that is too small for a pixel.
 * TL;DR: Each pixel of the canvas is drawn by one tile, whole, and from the image's pixels only.
 * Details:
 * - A tile drawn where its edges fall within pixels, as each tile scaled by the same factor is, leaves those pixels
 *   partly covered and partly transparent: a JPEG shows them darker, as a grid of lines over the thumbnail, 15 to 25%
 *   darker on an image of one grey. And the tiles at the right and the bottom go on past the image, as the grid's
 *   tiles are of one size, with pixels that the image does not show, which a pixel of the canvas across the image's
 *   edge would take in.
 * - Moving each edge to the nearest pixel shifts what a tile shows by half a pixel at most, from the shift of one of
 *   its edges to that of the other, with no step where two tiles meet: it does not show. Against ImageIO's rendering
 *   of the whole image at 400 pixels, the mean difference away from the tiles' edges went from 3.2-14.9 of 255 to
 *   3.3-15.1 for three photos of 4032x3024, whose difference over all the pixels went down, and from 11.5 to 12.4 for
 *   one of 8000x6000 with fine detail.
 * - Not chosen: drawing the tiles where they fall, added up ('lighter'), whose pixels across two tiles should be
 *   covered in full, left lines of 103 to 163 for 199, as Chromium's coverage of the two does not add up to one; and
 *   drawing the tiles whole on a canvas of the whole image, then resizing it once, which takes 195 MB for a photo of
 *   48 megapixels, of which the page makes two at a time.
 */
export function tilePlacements(image: Pick<HeifWholeImage, 'tileWidth' | 'tileHeight' | 'rows' | 'columns' | 'crop'>, width: number, height: number): Array<TilePlacement | null> {
  const { crop } = image;
  const columns = spans(image.tileWidth, image.columns, crop.x, crop.width, width);
  const rows = spans(image.tileHeight, image.rows, crop.y, crop.height, height);
  return rows.flatMap(row => columns.map(column => row && column && {
    source: { x: column.sourceStart, y: row.sourceStart, width: column.sourceSize, height: row.sourceSize },
    destination: { x: column.destinationStart, y: row.destinationStart, width: column.destinationSize, height: row.destinationSize },
  }));
}
