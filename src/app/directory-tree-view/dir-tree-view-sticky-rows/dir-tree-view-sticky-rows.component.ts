import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, signal, untracked } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {
  DirTreeViewFolderCheckboxAndNameComponent
} from '../dir-tree-view-folder-checkbox-and-name/dir-tree-view-folder-checkbox-and-name.component';
import { NestedNode } from '../directory-tree-view.model';
import { DirTreeViewStickyRowsService } from './dir-tree-view-sticky-rows.service';
import { ThumbnailSizeService } from '../../shared/thumbnail-size/thumbnail-size.service';
import { allowedStickyRows, StickyRow, stickyRowHeight, StickyRowsLayout, stickyFoldersOf, stickyRowsOf } from './sticky-rows';

/** What the rows kept at the top ask of the folder tree. */
export interface StickyRowsHost {
  /** How far each level of the tree is indented, in pixels. */
  readonly indentPerLevel: number;
  /** The rows of the tree, in the order shown. */
  rowElements(): ArrayLike<Element>;
  /** The row of a node, when the tree shows it. */
  rowOf(node: NestedNode): HTMLElement | undefined;
  /** The node of a row. */
  nodeOfRow(row: Element): NestedNode | undefined;
  /** The folder that a node is in, or null for the opened folder. */
  parentOf(node: NestedNode): NestedNode | null;
  /** The opened folder, as the tree's only root. */
  roots(): readonly NestedNode[];
  /** Whether the node is a folder that is expanded, with something in it. */
  isOpenFolder(node: NestedNode): boolean;
  /** As a click on the checkbox of the folder's row. */
  toggle(node: NestedNode): void;
  /** Collapses the folder, and shows its row `offset` pixels below the top of what the sidebar shows, at once. */
  collapse(node: NestedNode, offset: number): void;
  /** Scrolls the folder's row to `offset` pixels below that top, then focuses and lights it, as Reveal does. */
  scrollTo(node: NestedNode, offset: number): void;
  /** Opens the tree's context menu on the folder, with Scroll to Here first, which calls `scrollToHere`. */
  openMenu(event: MouseEvent, node: NestedNode, scrollToHere: () => void): void;
}

/** A row kept at the top, as the template shows it. */
interface ShownRow {
  readonly key: NestedNode | 'left out';
  readonly node: NestedNode;
  readonly level: number;
  readonly top: number;
  /** For the row of the folders left out: their names, one on a line, which its tooltip shows. */
  readonly leftOutNames?: string;
}

/**
 * The rows of the folders above the rows that the folder tree shows, kept at its top while it is scrolled, as the
 * folder of a long list of photos has its row out of sight: each folder's row as the tree has it, lower, with its
 * chevron, which collapses it, its checkbox and its name, and a menu with Scroll to Here, which scrolls the tree to the
 * folder's own row. At most as many as the settings say, with one that stands for the folders left out
 * (sticky-rows.ts). The opened folder and the folder of the rows shown are always among them.
 *
 * TL;DR: A component of its own, outside the tree's rows, whose signals change only when what it shows changes.
 * Details:
 * - The tree's rows are siblings, each indented by its level, rather than inside their folders' rows: CSS's sticky
 *   position would keep a folder's row at the top past its contents. So the rows are copies, in a box of no height
 *   that sticks at the top of the sidebar's pane, which scrolls sideways with the tree.
 * - A signal that the tree's own template read would have Angular check every row of the tree when it changed
 *   (docs/tasks/20261119_lazy-tree-rows/). Setting the rows at every frame of a scroll made the frames take 30 to 46 ms
 *   with 10,000 photos, against 17 when only changes are set; working out the rows takes 0.07 ms
 *   (docs/tasks/20261121_tree-sticky-folder-rows/STATUS.md).
 * - The rows are copies of rows that the tree has, so they are hidden from assistive technologies and out of the
 *   order of the Tab key. The keyboard reaches a folder's own row with the Left arrow key, from any row in it.
 */
@Component({
  selector: 'app-dir-tree-view-sticky-rows',
  templateUrl: './dir-tree-view-sticky-rows.component.html',
  styleUrl: './dir-tree-view-sticky-rows.component.scss',
  imports: [MatIcon, DirTreeViewFolderCheckboxAndNameComponent],
  host: { 'aria-hidden': 'true' },
})
export class DirTreeViewStickyRowsComponent {
  public readonly host = input.required<StickyRowsHost>();
  private readonly service = inject(DirTreeViewStickyRowsService);
  private readonly thumbnailSizeService = inject(ThumbnailSizeService);
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly rows = signal<readonly ShownRow[]>([]);
  /** As wide as what the sidebar scrolls, which a long name can make wider than the sidebar. */
  protected readonly width = signal(0);
  protected readonly rowHeight = stickyRowHeight;

  /** The box that scrolls the tree: the sidebar's lower pane. */
  private box: HTMLElement | null = null;
  /** The tree's element, which has its rows. */
  private tree: HTMLElement | null = null;
  private frame = 0;
  /**
   * The height of a photo's row, which the rows leave room for: measured once there is one, and on a resize or a new
   * size of the thumbnails.
   */
  private photoRowHeight = 0;
  /** The rows allowed last, which places a folder's row below the rows of the folders above it. */
  private allowed = 3;

  public constructor() {
    const destroyRef = inject(DestroyRef);
    // A new setting places the rows again: a new size of the thumbnails, with a photo's row measured again.
    effect(() => {
      this.service.maximum();
      this.service.leftOut();
      this.thumbnailSizeService.box();
      untracked(() => {
        this.photoRowHeight = 0;
        this.schedule();
      });
    });
    afterNextRender(() => {
      this.box = scrollingBoxOf(this.element);
      if (!this.box)
        return;
      const box = this.box;
      const resizes = new ResizeObserver(() => {
        this.photoRowHeight = 0;
        this.schedule();
      });
      // The rows change when a folder is expanded or collapsed, the tree sorted, or another folder opened.
      const rowChanges = new MutationObserver(this.schedule);
      destroyRef.onDestroy(() => {
        box.removeEventListener('scroll', this.schedule);
        resizes.disconnect();
        rowChanges.disconnect();
        cancelAnimationFrame(this.frame);
        this.service.measureWith(null);
        this.service.cover(0);
      });
      this.service.measureWith(this.heightAt);
      box.addEventListener('scroll', this.schedule, { passive: true });
      resizes.observe(box);
      this.tree = this.element.parentElement?.querySelector('mat-tree') ?? null;
      if (this.tree)
        rowChanges.observe(this.tree, { childList: true });
    });
  }

  /** Places the rows at the next frame, once for all that happened before it. */
  private readonly schedule = (): void => {
    if (!this.frame)
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.update();
      });
  };

  private update(): void {
    const box = this.box;
    if (!box)
      return;
    this.allowed = allowedStickyRows({
      maximum: this.service.maximum(), boxHeight: box.clientHeight, photoRowHeight: this.photoRowHeightIn(),
    });
    this.show(this.rowsAt(box, box.scrollTop));
    // TL;DR: As wide as the tree with what its long names make it overflow, rather than as what the pane scrolls.
    // Details: The pane's scrollWidth counts these rows too: with that width, they kept it once the pane had become
    // narrower, and so its horizontal scroll bar while they were shown.
    const width = this.tree?.scrollWidth ?? 0;
    if (width !== this.width())
      this.width.set(width);
  }

  /** The rows kept at the top with the box scrolled to `scrollTop`, as the tree is laid out now. */
  private rowsAt(box: HTMLElement, scrollTop: number): StickyRow[] {
    const host = this.host();
    // From the top of what the box would show: the rows are where they are, moved by as much as the box would scroll.
    const boxTop = box.getBoundingClientRect().top + box.clientTop + scrollTop - box.scrollTop;
    const topOf = (row: Element) => row.getBoundingClientRect().top - boxTop;
    const rowElements = host.rowElements();
    const layout: StickyRowsLayout = {
      // TL;DR: A binary search over the rows, which are in the order shown.
      // Details: document.elementsFromPoint() goes through every row of the tree: about 10 ms with 10,000 photos, for
      // each level of folders.
      nodeAt: offset => {
        let low = 0, high = rowElements.length - 1, found = -1;
        while (low <= high) {
          const middle = (low + high) >> 1;
          if (topOf(rowElements[middle]) <= offset) {
            found = middle;
            low = middle + 1;
          } else {
            high = middle - 1;
          }
        }
        return found < 0 ? undefined : host.nodeOfRow(rowElements[found]);
      },
      parentOf: node => host.parentOf(node),
      isOpenFolder: node => host.isOpenFolder(node),
      rowTopOf: node => {
        const row = host.rowOf(node);
        return row ? topOf(row) : undefined;
      },
      endOf: folder => {
        const after = this.rowAfter(folder);
        return after ? topOf(after) : Infinity;
      },
    };
    return stickyRowsOf(stickyFoldersOf(layout, this.allowed), this.allowed, this.service.leftOut());
  }

  /** How high the rows kept at the top would be with the box scrolled to `scrollTop`. */
  private readonly heightAt = (scrollTop: number): number => {
    const box = this.box;
    return box ? coveredHeightOf(this.rowsAt(box, scrollTop)) : 0;
  };

  /** Gives the template the rows, and the service their height, only when they have changed. */
  private show(rows: readonly StickyRow[]): void {
    const shown: ShownRow[] = rows.map(row => ({
      key: row.leftOut ? 'left out' : row.node,
      node: row.node,
      level: this.depthOf(row.node),
      top: row.top,
      ...(row.leftOut ? { leftOutNames: row.leftOut.map(folder => folder.name).join('\n') } : {}),
    }));
    const previous = this.rows();
    const unchanged = previous.length === shown.length && shown.every((row, index) =>
      row.key === previous[index].key && row.node === previous[index].node && row.top === previous[index].top
      && row.leftOutNames === previous[index].leftOutNames);
    if (!unchanged)
      this.rows.set(shown);
    const covered = coveredHeightOf(rows);
    if (covered !== this.service.coveredHeight())
      this.service.cover(covered);
  }

  /** The height of a photo's row of the tree, which the rows leave room for below them. */
  private photoRowHeightIn(): number {
    if (!this.photoRowHeight) {
      const viewer = this.element.parentElement?.querySelector('mat-tree app-photo-info-viewer');
      this.photoRowHeight = viewer?.closest('mat-tree-node')?.getBoundingClientRect().height ?? 0;
    }
    // The height of a photo's row in the sidebar, until the tree has one.
    return this.photoRowHeight || 237;
  }

  /** The row that follows the folder's contents: its next sibling's, or that of the nearest folder above it. */
  private rowAfter(folder: NestedNode): HTMLElement | undefined {
    const host = this.host();
    for (let current: NestedNode | null = folder; current; current = host.parentOf(current)) {
      const parent = host.parentOf(current);
      const siblings = parent ? parent.children : host.roots();
      const next = siblings[siblings.indexOf(current) + 1];
      if (next)
        return host.rowOf(next);
    }
    return undefined;
  }

  private depthOf(node: NestedNode): number {
    let depth = 0;
    for (let parent = this.host().parentOf(node); parent; parent = this.host().parentOf(parent))
      depth++;
    return depth;
  }

  /** Where a folder's own row goes: below the rows of the folders above it, which are at most those allowed. */
  private offsetOf(node: NestedNode): number {
    return Math.min(this.depthOf(node), this.allowed) * stickyRowHeight;
  }

  protected collapse(node: NestedNode): void {
    this.host().collapse(node, this.offsetOf(node));
  }

  protected openMenu(event: MouseEvent, node: NestedNode): void {
    this.host().openMenu(event, node, () => this.host().scrollTo(node, this.offsetOf(node)));
  }

  protected toggle(node: NestedNode): void {
    this.host().toggle(node);
  }
}

/** How high the rows are, from the box's top: as low as the lowest of them reaches. */
function coveredHeightOf(rows: readonly StickyRow[]): number {
  return Math.max(0, ...rows.map(row => row.top + stickyRowHeight));
}

/** The nearest box around the element that scrolls it up and down, whether or not it has more than it shows yet. */
function scrollingBoxOf(element: HTMLElement): HTMLElement | null {
  for (let box = element.parentElement; box; box = box.parentElement) {
    const { overflowY } = getComputedStyle(box);
    if (overflowY === 'auto' || overflowY === 'scroll')
      return box;
  }
  return null;
}
