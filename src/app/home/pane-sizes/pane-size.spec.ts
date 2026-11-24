import { parseSavedSize, shownKeptPaneSize, splitPercentages } from './pane-size';

describe('pane sizes of the home view', () => {
  describe('shownKeptPaneSize', () => {
    // As the sidebar's split: the sidebar keeps its width, and both it and the map's side are at least 200 pixels.
    const sidebar = { min: 200, max: Infinity, otherMin: 200 };
    // As the map's split: the chart keeps its height, and leaves the map 200 pixels.
    const chart = { min: 0, max: Infinity, otherMin: 200 };
    // As the sidebar's own split: its upper pane, at most 66 pixels.
    const upperPane = { min: 0, max: 66, otherMin: 0 };

    it('shows the size where the room holds it', () => {
      expect(shownKeptPaneSize(312, 992, sidebar)).toBe(312);
      expect(shownKeptPaneSize(240, 792, chart)).toBe(240);
      expect(shownKeptPaneSize(30, 700, upperPane)).toBe(30);
    });

    it('leaves the other pane its least size where the room is short, and keeps the kept pane at its own', () => {
      expect(shownKeptPaneSize(600, 692, sidebar)).toBe(492);
      expect(shownKeptPaneSize(150, 692, sidebar)).toBe(200);
      expect(shownKeptPaneSize(500, 592, chart)).toBe(392);
      expect(shownKeptPaneSize(500, 150, chart)).toBeUndefined();
    });

    it('gives no size where the room cannot hold both least sizes, for the default shares', () => {
      expect(shownKeptPaneSize(312, 400, sidebar)).toBe(200);
      expect(shownKeptPaneSize(312, 399, sidebar)).toBeUndefined();
      expect(shownKeptPaneSize(240, 199, chart)).toBeUndefined();
    });

    it('keeps a size within its largest, and within a short room without a least size for the other', () => {
      expect(shownKeptPaneSize(66, 700, upperPane)).toBe(66);
      expect(shownKeptPaneSize(90, 700, upperPane)).toBe(66);
      expect(shownKeptPaneSize(66, 40, upperPane)).toBe(40);
      expect(shownKeptPaneSize(0, 700, upperPane)).toBe(0);
    });
  });

  describe('splitPercentages', () => {
    it('gives the percentages that make the pane the size, as Split.js takes half the gutter from each pane', () => {
      expect(splitPercentages(0, 246, 1000, 8)).toEqual([25, 75]);
      expect(splitPercentages(1, 236, 800, 8)).toEqual([70, 30]);
      const [first, second] = splitPercentages(0, 66, 700, 4);
      expect(first / 100 * 700 - 2).toBeCloseTo(66, 10);
      expect(first + second).toBeCloseTo(100, 10);
    });
  });

  describe('parseSavedSize', () => {
    it('reads a saved number of pixels', () => {
      expect(parseSavedSize('312')).toBe(312);
      expect(parseSavedSize('0')).toBe(0);
      expect(parseSavedSize('240.5')).toBe(240.5);
    });

    it('reads none from what was not saved, or put back to the default, or is not a size', () => {
      for (const text of ['', ' ', 'abc', '-1', 'Infinity', 'NaN', '12px'])
        expect(parseSavedSize(text)).toBeUndefined();
    });
  });
});
