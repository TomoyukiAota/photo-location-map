import { DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';
import { NearViewService } from './near-view.service';

/**
 * Tells the components inside its element whether the element has come near the part of the page that is shown
 * (NearViewService), so that they make what is costly in them only from then on. A file's row of the folder tree has
 * it, for its checkbox and its photo's thumbnail and buttons.
 * TL;DR: A component inside reads isNear() in its own template, which a template of the tree must not.
 * Details: A row of the tree is an embedded view, which Angular gives no reactive consumer of its own: a signal read
 * in it has Angular check the component that the view is in, the tree, and every row with it, whenever the signal
 * changes. Scrolling past the rows of 10,000 photos ran 6.5 s of scripts in 60 frames that way, and 49 ms with the
 * signal read in a component's template (docs/tasks/20261119_lazy-tree-rows/STATUS.md).
 */
@Directive({
  selector: '[appNearView]',
})
export class NearViewDirective {
  private readonly near = signal(false);
  /** Whether the element has come near the part of the page that is shown. It stays near once it has. */
  public readonly isNear = this.near.asReadonly();

  constructor() {
    const stopWatching = inject(NearViewService).watch(inject(ElementRef).nativeElement, () => this.near.set(true));
    inject(DestroyRef).onDestroy(stopWatching);
  }
}
