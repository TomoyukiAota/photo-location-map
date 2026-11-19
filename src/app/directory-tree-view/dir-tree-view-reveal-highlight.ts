/**
 * The states of the highlight of a revealed row, which its attribute `data-reveal-highlight` has: each is a transition
 * of the row's background in directory-tree-view.component.scss.
 */
type RevealHighlightState = 'lit' | 'fading' | 'fading-fast';

/** How long each state of the highlight lasts, in milliseconds. The transitions in the styles take as long. */
export const revealHighlightMs = {
  /** It lights up, in the first 0.45 s, and stays lit. */
  lit: 1200,
  /** Then it fades back. */
  fading: 1800,
  /** Or it fades back in less time, when another row is revealed while it is lit. */
  fadingFast: 400,
} as const;

/** How long after its transition a state ends, so that the transition has ended in its last frame. */
const afterTransitionMs = 100;

/**
 * The highlights of revealed rows of the folder tree: a row lights up, stays lit for a moment and fades back, each
 * speeding up from nothing and slowing down at its end.
 * TL;DR: Set on the row's element, as its class is when its context menu is open, rather than bound in the tree's
 * template, which would have Angular check every row whenever a highlight changes.
 * Details: A row is an embedded view of the tree, which has no reactive consumer of its own, so that a signal read in
 * the tree's template has Angular check every row's node, whose bindings took 180 to 270 ms with 10,000 photos in a
 * folder, on a computer that other work shared (docs/tasks/20261119_checkbox-checks-changed-rows/STATUS.md). Select
 * Previous and Select Next reveal a row at each step, and a highlight changes three times. A row made again, as when
 * its folder is expanded again, has no highlight.
 */
export class RevealHighlights {
  private readonly rows = new Map<HTMLElement, { state: RevealHighlightState; timer: ReturnType<typeof setTimeout> }>();

  /** Lights the row up, from where its highlight is when it has one, and fades it back after a moment. */
  public light(row: HTMLElement): void {
    this.set(row, 'lit', revealHighlightMs.lit, () =>
      this.set(row, 'fading', revealHighlightMs.fading + afterTransitionMs, () => this.remove(row)));
  }

  /** Fades back a row that is lit, in less time, as another row is revealed. A row that is fading goes on as it is. */
  public fadeLitRows(): void {
    for (const [row, { state }] of this.rows) {
      if (state === 'lit')
        this.set(row, 'fading-fast', revealHighlightMs.fadingFast + afterTransitionMs, () => this.remove(row));
    }
  }

  /** Forgets the highlights, as when the tree goes. */
  public clear(): void {
    for (const { timer } of this.rows.values())
      clearTimeout(timer);
    this.rows.clear();
  }

  private set(row: HTMLElement, state: RevealHighlightState, ms: number, then: () => void): void {
    clearTimeout(this.rows.get(row)?.timer);
    row.setAttribute('data-reveal-highlight', state);
    this.rows.set(row, { state, timer: setTimeout(then, ms) });
  }

  private remove(row: HTMLElement): void {
    row.removeAttribute('data-reveal-highlight');
    this.rows.delete(row);
  }
}
