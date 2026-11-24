import Split from 'split.js';
import { KeptPaneLimits, shownKeptPaneSize, splitPercentages } from './pane-size.js';

export interface PaneSplitOptions {
  /** The two panes, in the DOM's order, which have the same parent. */
  panes: [HTMLElement, HTMLElement];
  /** The gutter between them, an element of the home view's template, which Split.js takes rather than making one. */
  gutter: HTMLElement;
  direction: 'horizontal' | 'vertical';
  gutterSize: number;
  /** Each pane's least size while the gutter is dragged: Split.js's minSize. */
  minSize: number | number[];
  /** Each pane's largest size while the gutter is dragged: Split.js's maxSize. */
  maxSize?: number | number[];
  /** The panes' shares in percents, which follow the parent's size, while the kept pane has no size of its own. */
  defaultShares: [number, number];
  /** The pane, 0 or 1 in the DOM's order, that keeps its size while the parent's size changes. */
  keptPane: 0 | 1;
  /** The kept pane's size by default, in pixels, or none for the default shares. */
  defaultSize?: number;
  /** The size that the user gave the kept pane at a former launch, or none. */
  savedSize?: number;
  /** Within what the kept pane is shown at its size. */
  limits: KeptPaneLimits;
  /**
   * When the kept pane is shown at its size again: at each change of the parent's size, by default, or at a resize of
   * the window only.
   */
  showSizeAt?: 'parent-resize' | 'window-resize';
  /** At the end of a drag that moved the gutter: the panes' sizes then, in pixels and in the DOM's order. */
  onDragged?(sizes: [number, number]): void;
}

/**
 * A split of Split.js whose one pane keeps its size in pixels while the parent's size changes, once it has one: a size
 * that the user gave it by dragging the gutter, at this launch or a former one, or its default. Without one, the panes
 * keep their shares of the parent, as Split.js's sizes do. reset() puts the split back to its default.
 */
export class PaneSplit {
  private readonly split: Split.Instance;
  private readonly parent: HTMLElement;
  /**
   * TL;DR: Whether the parent lays the panes out in reverse, as the sidebar's row is in a language written from right to
   * left: Split.js's setSizes() gives each pane the other's size there, so it is given the shares reversed.
   * Details: In a reversed row, Split.js swaps the two panes of its pair, so that the gutter follows the mouse, and
   * setSizes() sets the pair's panes in their order. The sizes at creation and those of getSizes() follow the DOM's
   * order. In a reversed row of 1000 pixels, made with the sizes [25, 75], the first pane was 246 pixels wide, and 746
   * after setSizes([25, 75]), which getSizes() then gave as [75, 25] (Split.js 1.6.5 in Electron 45).
   */
  private readonly reversed: boolean;
  /** The kept pane's size, in pixels, or none while the panes keep their shares. */
  private keptSize: number | undefined;
  /** The least size that the kept pane leaves the other: its limit, or less where a drag made the other smaller. */
  private otherMin: number;
  private sharesAtDragStart: number[] | undefined;
  private readonly stopWatching: () => void;

  constructor(private readonly options: PaneSplitOptions) {
    this.parent = options.panes[0].parentElement;
    const flexDirection = getComputedStyle(this.parent).flexDirection;
    this.reversed = flexDirection === 'row-reverse' || flexDirection === 'column-reverse';
    this.keptSize = options.savedSize ?? options.defaultSize;
    this.otherMin = options.limits.otherMin;
    this.split = Split(options.panes, {
      sizes: this.sharesNow(), // Split.js takes these in the DOM's order, in either direction.
      minSize: options.minSize,
      maxSize: options.maxSize,
      gutterSize: options.gutterSize,
      direction: options.direction,
      snapOffset: 0,
      gutter: () => options.gutter,
      onDragStart: shares => this.sharesAtDragStart = shares,
      onDragEnd: shares => this.endDrag(shares),
    });
    if (options.showSizeAt === 'window-resize') {
      const listener = () => this.showKeptSize();
      window.addEventListener('resize', listener);
      this.stopWatching = () => window.removeEventListener('resize', listener);
    } else {
      // At each change of the parent's size: the window's, or the room that a status bar or the sidebar leaves it.
      const resizeObserver = new ResizeObserver(() => this.showKeptSize());
      resizeObserver.observe(this.parent);
      this.stopWatching = () => resizeObserver.disconnect();
    }
  }

  /** Puts the split back to its default: the panes' default shares, or the kept pane's default size. */
  public reset(): void {
    this.keptSize = this.options.defaultSize;
    this.otherMin = this.options.limits.otherMin;
    this.setShares(this.sharesNow());
  }

  public destroy(): void {
    this.stopWatching();
  }

  /** Shows the kept pane at its size in the parent's room now. Without a size, the shares follow the parent by themselves. */
  private showKeptSize(): void {
    // A parent that is not shown has no room: the pane is shown at its size at the next change, once it is.
    if (this.keptSize === undefined || this.parentSize() === 0)
      return;
    this.setShares(this.sharesNow());
  }

  /** The panes' shares for the kept pane's size in the parent's room now; the default shares where it has no room. */
  private sharesNow(): [number, number] {
    const parentSize = this.parentSize();
    const limits = { ...this.options.limits, otherMin: this.otherMin };
    const shown = this.keptSize === undefined || parentSize === 0 ? undefined
      : shownKeptPaneSize(this.keptSize, parentSize - this.options.gutterSize, limits);
    return shown === undefined ? this.options.defaultShares
      : splitPercentages(this.options.keptPane, shown, parentSize, this.options.gutterSize);
  }

  private setShares(shares: [number, number]): void {
    this.split.setSizes(this.reversed ? [shares[1], shares[0]] : shares);
  }

  /**
   * Keeps the size that a drag gave the kept pane. A click on the gutter, as each of a double-click's two, ends a drag
   * that moved nothing, which keeps nothing: a pane that follows the parent keeps doing so.
   */
  private endDrag(shares: number[]): void {
    const moved = shares.some((share, index) => share !== this.sharesAtDragStart?.[index]);
    this.sharesAtDragStart = undefined;
    if (!moved)
      return;
    const sizes = this.options.panes.map(pane => Math.round(this.sizeOf(pane))) as [number, number];
    this.keptSize = sizes[this.options.keptPane];
    this.otherMin = Math.min(this.options.limits.otherMin, sizes[1 - this.options.keptPane]);
    this.options.onDragged?.(sizes);
  }

  private parentSize(): number {
    return this.sizeOf(this.parent);
  }

  private sizeOf(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    return this.options.direction === 'horizontal' ? rect.width : rect.height;
  }
}
