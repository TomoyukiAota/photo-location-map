import { TilePlacement, tilePlacements } from './tile-placement';

/** How many tiles draw each pixel of a canvas of `width` x `height`, and whether each tile's edges are whole pixels. */
function coverageOf(placements: Array<TilePlacement | null>, width: number, height: number) {
  const draws = new Array<number>(width * height).fill(0);
  let edgesWithinPixels = 0;
  for (const placement of placements) {
    if (!placement)
      continue;
    const { x, y, width: drawnWidth, height: drawnHeight } = placement.destination;
    if (![x, y, drawnWidth, drawnHeight].every(Number.isInteger)) {
      edgesWithinPixels++;
      continue;
    }
    for (let row = Math.max(0, y); row < Math.min(height, y + drawnHeight); row++)
      for (let column = Math.max(0, x); column < Math.min(width, x + drawnWidth); column++)
        draws[row * width + column]++;
  }
  return { edgesWithinPixels, pixelsNotDrawnOnce: draws.filter(count => count !== 1).length };
}

describe('tilePlacements', () => {
  it('has each pixel of the thumbnail of an iPhone photo drawn by one tile, from edges on whole pixels', () => {
    // 12 megapixels, 4032x3024, in a grid of 8x6 tiles of 512x512, at 400x300: each tile 50.79 pixels wide.
    const image = { tileWidth: 512, tileHeight: 512, columns: 8, rows: 6, crop: { x: 0, y: 0, width: 4032, height: 3024 } };
    const placements = tilePlacements(image, 400, 300);
    expect(placements).toHaveLength(48);
    expect(coverageOf(placements, 400, 300)).toEqual({ edgesWithinPixels: 0, pixelsNotDrawnOnce: 0 });
    expect(placements[1]?.destination).toEqual({ x: 51, y: 0, width: 51, height: 51 });
  });

  it('draws only the part of a tile that the image shows, to the canvas\'s edge', () => {
    // 1100x700 in 3x2 tiles of 512x512 (test/e2e/fixtures/uniform-tiles.heic): the last column shows 76 pixels of its
    // tiles and the last row 188, as the tiles go on past the image. At 400 pixels, its 700 are 254.5, and 255 on the
    // canvas, whose last pixels the tile would fill with what is past the image if it were scaled by 400/1100.
    const image = { tileWidth: 512, tileHeight: 512, columns: 3, rows: 2, crop: { x: 0, y: 0, width: 1100, height: 700 } };
    const placements = tilePlacements(image, 400, 255);
    expect(coverageOf(placements, 400, 255)).toEqual({ edgesWithinPixels: 0, pixelsNotDrawnOnce: 0 });
    expect(placements[5]).toEqual({
      source: { x: 0, y: 0, width: 76, height: 188 },
      destination: { x: 372, y: 187, width: 28, height: 68 },
    });
  });

  it('starts at the image\'s offset in the grid, and leaves out a tile that the image does not show', () => {
    // An image cropped from the grid (clap) to 600x400 at 600,100: the first column of tiles is outside it.
    const image = { tileWidth: 512, tileHeight: 512, columns: 3, rows: 2, crop: { x: 600, y: 100, width: 600, height: 400 } };
    const placements = tilePlacements(image, 300, 200);
    expect(placements[0]).toBeNull();
    expect(placements[3]).toBeNull();
    expect(placements[1]).toEqual({
      source: { x: 88, y: 100, width: 424, height: 400 },
      destination: { x: 0, y: 0, width: 212, height: 200 },
    });
    expect(coverageOf(placements, 300, 200)).toEqual({ edgesWithinPixels: 0, pixelsNotDrawnOnce: 0 });
  });

  it('leaves out a tile too small for a pixel of the canvas', () => {
    const image = { tileWidth: 512, tileHeight: 512, columns: 2, rows: 1, crop: { x: 0, y: 0, width: 514, height: 512 } };
    const placements = tilePlacements(image, 100, 100);
    expect(placements[1]).toBeNull();
    expect(coverageOf(placements, 100, 100)).toEqual({ edgesWithinPixels: 0, pixelsNotDrawnOnce: 0 });
  });
});
