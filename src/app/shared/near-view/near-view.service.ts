import { Service } from '@angular/core';

/**
 * How near the part of the page that is shown an element counts as near, in pixels: as near as Chromium starts to load
 * an image whose loading is lazy, which it did from about 1250 pixels away in the sidebar
 * (docs/tasks/20261119_lazy-tree-rows/STATUS.md), so that the thumbnail of a row of the tree starts to load when it did
 * while every row made its thumbnail at once.
 */
export const nearViewMarginPx = 1250;

/**
 * Tells when an element comes near the part of the page that is shown.
 * TL;DR: One IntersectionObserver for every element, with a margin around the window and around each box that the
 * element scrolls in, such as the sidebar's pane; it stops watching an element once the element has come near.
 * Details: The margin around the window is the observer's rootMargin, and the one around the boxes is its
 * scrollMargin. A row of the folder tree scrolls in the sidebar's pane, which fills the window's height and hides
 * what is below its own view: with rootMargin alone, a row just below the pane's view would not count as near.
 */
@Service()
export class NearViewService {
  /** What to do when each element that is watched comes near. */
  private readonly whenNear = new Map<Element, () => void>();
  private observer: IntersectionObserver | undefined;

  /**
   * Calls `whenNear` once, when the element comes near the part of the page that is shown, or, when it is near
   * already, as soon as the page has been laid out. Returns a function that stops watching the element, for an
   * element that is removed before it came near.
   */
  public watch(element: Element, whenNear: () => void): () => void {
    this.observer ??= new IntersectionObserver(entries => this.handle(entries), {
      rootMargin: `${nearViewMarginPx}px`,
      scrollMargin: `${nearViewMarginPx}px`,
    });
    this.whenNear.set(element, whenNear);
    this.observer.observe(element);
    return () => this.stopWatching(element);
  }

  private handle(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const whenNear = this.whenNear.get(entry.target);
      if (!entry.isIntersecting || !whenNear)
        continue;
      this.stopWatching(entry.target);
      whenNear();
    }
  }

  private stopWatching(element: Element): void {
    if (this.whenNear.delete(element))
      this.observer?.unobserve(element);
  }
}
