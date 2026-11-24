// The size in CSS pixels that a pane of the home view keeps while the window changes: the sidebar's width and the
// chart's height once the user has dragged their gutter, which are saved for the next launch, and the height of the
// sidebar's upper pane. The map takes what the window gains or loses (docs/tasks/20261125_pane-sizes/STATUS.md).

/** The limits within which a split shows its kept pane, in pixels. */
export interface KeptPaneLimits {
  /** The kept pane's least size. */
  min: number;
  /** The kept pane's largest size. */
  max: number;
  /** The least size that the kept pane leaves the other pane. */
  otherMin: number;
}

/**
 * The size at which a split shows its kept pane: `size`, within `limits` and within `room`, the room that the parent
 * has for the two panes, which is its size less the gutter's. Undefined where the room cannot hold the kept pane's
 * least size and the other's: the split shows its default shares there, as Split.js gives up its minimums too.
 */
export function shownKeptPaneSize(size: number, room: number, limits: KeptPaneLimits): number | undefined {
  const largest = Math.min(limits.max, room - limits.otherMin);
  if (largest < limits.min)
    return undefined;
  return Math.min(Math.max(size, limits.min), largest);
}

/**
 * The percentages that Split.js takes, in the DOM's order, for its pane `index` to be `size` pixels high or wide, in a
 * parent of `parentSize` pixels: Split.js makes each of two panes `calc(p% - gutterSize / 2 px)`.
 */
export function splitPercentages(index: 0 | 1, size: number, parentSize: number, gutterSize: number): [number, number] {
  const kept = (size + gutterSize / 2) * 100 / parentSize;
  return index === 0 ? [kept, 100 - kept] : [100 - kept, kept];
}

/** A size that was saved as its text: a number of pixels, not negative. Undefined for none, which is saved as ''. */
export function parseSavedSize(text: string): number | undefined {
  const size = text.trim() === '' ? NaN : Number(text);
  return Number.isFinite(size) && size >= 0 ? size : undefined;
}
