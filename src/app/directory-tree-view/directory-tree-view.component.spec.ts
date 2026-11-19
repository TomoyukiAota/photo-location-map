import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTree } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
import { Photo } from '../shared/model/photo.model';
import { NearViewService } from '../shared/near-view/near-view.service';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { PhotoRevealService } from '../shared/service/photo-reveal.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { DirTreeViewNodeSelection } from './dir-tree-view-node-selection';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from './directory-tree-view-selection.service';
import { DirectoryTreeViewComponent, revealHighlightMs } from './directory-tree-view.component';
import { NestedNode } from './directory-tree-view.model';

// A photo's information has tests of its own (src/app/photo-info-viewer/).
@Component({ selector: 'app-photo-info-viewer', template: '' })
class DummyPhotoInfoViewerComponent {
  public readonly photo = input<Photo>();
  public readonly place = input<string>();
}

/**
 * NearViewService, as jsdom has no IntersectionObserver: a row is near what is shown as soon as it is made, as the rows
 * at the top of the tree are, unless the test keeps the rows away until it brings them near.
 */
class NearViewDouble implements Pick<NearViewService, 'watch'> {
  public keepsAway = false;
  private readonly waiting = new Map<Element, () => void>();

  public watch(element: Element, whenNear: () => void): () => void {
    if (!this.keepsAway) {
      whenNear();
      return () => undefined;
    }
    this.waiting.set(element, whenNear);
    return () => this.waiting.delete(element);
  }

  public bringNear(): void {
    const whenNear = [...this.waiting.values()];
    this.waiting.clear();
    whenNear.forEach(each => each());
  }
}

/** A node of the tree that nothing can select, so that only what is expanded matters. */
function node(path: string, children: NestedNode[] = []): NestedNode {
  return Object.assign(new NestedNode(), {
    name: path.split('/').pop(),
    path,
    type: children.length > 0 ? 'directory' : 'file',
    fsStats: undefined,
    isSelectable: false,
    children,
  });
}

describe('DirectoryTreeViewComponent', () => {
  let fixture: ComponentFixture<DirectoryTreeViewComponent>;
  let dataService: DirectoryTreeViewDataService;
  let tree: MatTree<NestedNode>;
  let nearView: NearViewDouble;

  beforeEach(async () => {
    nearView = new NearViewDouble();
    await TestBed.configureTestingModule({
      imports: [DirectoryTreeViewComponent],
      providers: [{ provide: NearViewService, useValue: nearView }],
    })
      .overrideComponent(DirectoryTreeViewComponent, {
        remove: { imports: [PhotoInfoViewerComponent] },
        add: { imports: [DummyPhotoInfoViewerComponent] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(DirectoryTreeViewComponent);
    dataService = TestBed.inject(DirectoryTreeViewDataService);
    await fixture.whenStable();
    tree = fixture.debugElement.query(By.directive(MatTree)).componentInstance;
  });

  it('collapses what was expanded in the previous folder when another folder opens', async () => {
    // The tree keeps the nodes that it has expanded, and each holds everything below it.
    const subfolder = node('/first/subfolder', [node('/first/subfolder/photo.jpg')]);
    const first = node('/first', [subfolder]);
    dataService.dataReplaced.next([first]);
    await fixture.whenStable();
    tree.expand(subfolder);
    await fixture.whenStable();
    expect(tree.isExpanded(first)).toBe(true);
    expect(tree.isExpanded(subfolder)).toBe(true);

    const second = node('/second', [node('/second/photo.jpg')]);
    dataService.dataReplaced.next([second]);
    await fixture.whenStable();

    expect(tree.isExpanded(first)).toBe(false);
    expect(tree.isExpanded(subfolder)).toBe(false);
    expect(tree.isExpanded(second)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('photo.jpg');
    expect(fixture.nativeElement.textContent).not.toContain('subfolder');
  });

  it('makes the checkbox of a photo\'s row once the row comes near what is shown, with the photo\'s name before it', async () => {
    nearView.keepsAway = true;
    const photo = Object.assign(node('/folder/photo.jpg'), { isSelectable: true });
    dataService.dataReplaced.next([node('/folder', [photo])]);
    await fixture.whenStable();
    const row: HTMLElement = fixture.nativeElement.querySelector('mat-tree-node.leaf-tree-node');
    expect(row.querySelector('mat-checkbox')).toBeNull();
    expect(row.querySelector('bdi').textContent).toBe('photo.jpg');

    nearView.bringNear();
    await fixture.whenStable();

    expect(row.querySelector('mat-checkbox bdi').textContent).toBe('photo.jpg');
  });

  it('makes the checkbox of a photo\'s row with the selection made while the row was away, and updates it after', async () => {
    // As Select Previous and Select Next or the map select a photo, whose row may be far from what is shown.
    nearView.keepsAway = true;
    // The selected photos, which a selection gives to SelectedPhotoService, need only their paths here.
    vi.spyOn(TestBed.inject(PhotoDataService), 'getPhoto').mockImplementation(path => ({ path }) as Photo);
    const photos = ['/folder/a.jpg', '/folder/b.jpg'].map(path => Object.assign(node(path), { isSelectable: true }));
    dataService.dataReplaced.next([node('/folder', photos)]);
    await fixture.whenStable();
    const selection = TestBed.inject(DirectoryTreeViewSelectionService);
    /** Whether each photo's checkbox is checked, by the photo's name. */
    const checked = () => Object.fromEntries([...fixture.nativeElement.querySelectorAll('mat-tree-node.leaf-tree-node')]
      .map((row: HTMLElement) => [row.querySelector('bdi').textContent, row.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked]));

    selection.select(['/folder/b.jpg']);
    await fixture.whenStable();
    expect(checked()).toEqual({ 'a.jpg': undefined, 'b.jpg': undefined });

    nearView.bringNear();
    await fixture.whenStable();
    expect(checked()).toEqual({ 'a.jpg': false, 'b.jpg': true });

    selection.select(['/folder/a.jpg']);
    await fixture.whenStable();
    expect(checked()).toEqual({ 'a.jpg': true, 'b.jpg': false });
  });

  it('does not expand a photo\'s node when its row is clicked, which would render the tree again', async () => {
    const photo = Object.assign(node('/folder/photo.jpg'), { isSelectable: true });
    dataService.dataReplaced.next([node('/folder', [photo])]);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('mat-tree-node.leaf-tree-node').click();
    await fixture.whenStable();

    expect(tree.isExpanded(photo)).toBe(false);
  });

  describe('revealing a photo from the map', () => {
    const photo = Object.assign(new Photo(), { name: 'photo.jpg', path: '/opened/a/b/photo.jpg' });
    const b = node('/opened/a/b', [node('/opened/a/b/other.jpg'), node(photo.path)]);
    const a = node('/opened/a', [b]);
    const opened = node('/opened', [a, node('/opened/z.jpg')]);
    let scrolledIntoView: HTMLElement[];
    let scrollOptions: ScrollIntoViewOptions[];

    const rowOf = (name: string) => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('mat-tree-node'))
      .find(row => row.textContent.includes(name));

    beforeEach(async () => {
      // The page has no layout here, and jsdom no scrollIntoView().
      scrolledIntoView = [];
      scrollOptions = [];
      Element.prototype.scrollIntoView = function (this: HTMLElement, options: ScrollIntoViewOptions) {
        scrolledIntoView.push(this);
        scrollOptions.push(options);
      };
      dataService.dataReplaced.next([opened]);
      await fixture.whenStable();
    });

    afterEach(() => delete Element.prototype.scrollIntoView);

    it('expands the folders above it, and scrolls its row to the middle of the sidebar', async () => {
      expect(rowOf('photo.jpg')).toBeUndefined();

      TestBed.inject(PhotoRevealService).revealInSidebar(photo);
      await fixture.whenStable();

      expect(tree.isExpanded(a)).toBe(true);
      expect(tree.isExpanded(b)).toBe(true);
      expect(scrolledIntoView).toEqual([rowOf('photo.jpg')]);
      expect(scrollOptions).toEqual([{ block: 'center', inline: 'nearest' }]);
    });

    it('highlights its row for a moment, anew when it is revealed again', async () => {
      const reveal = () => TestBed.inject(PhotoRevealService).revealInSidebar(photo);
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        reveal();
        fixture.detectChanges();
        expect(rowOf('photo.jpg').getAttribute('data-reveal-highlight')).toBe('1');
        expect(rowOf('other.jpg').hasAttribute('data-reveal-highlight')).toBe(false);

        // Another animation of the same highlight, which starts from its beginning.
        vi.advanceTimersByTime(revealHighlightMs - 1000);
        reveal();
        fixture.detectChanges();
        expect(rowOf('photo.jpg').getAttribute('data-reveal-highlight')).toBe('2');

        vi.advanceTimersByTime(revealHighlightMs);
        fixture.detectChanges();
        expect(rowOf('photo.jpg').getAttribute('data-reveal-highlight')).toBe('2');
        vi.advanceTimersByTime(500);
        fixture.detectChanges();
        expect(rowOf('photo.jpg').hasAttribute('data-reveal-highlight')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it('highlights the row of a photo revealed from the map before the row has made its checkbox', async () => {
    // The row is scrolled to and highlighted at once, and makes its checkbox once the observer finds it near.
    Element.prototype.scrollIntoView = () => undefined; // jsdom has none.
    try {
      nearView.keepsAway = true;
      const photo = Object.assign(new Photo(), { name: 'photo.jpg', path: '/opened/a/photo.jpg' });
      dataService.dataReplaced.next([node('/opened', [node('/opened/a', [Object.assign(node(photo.path), { isSelectable: true })])])]);
      await fixture.whenStable();

      TestBed.inject(PhotoRevealService).revealInSidebar(photo);
      await fixture.whenStable();
      const row: HTMLElement = fixture.nativeElement.querySelector('mat-tree-node.leaf-tree-node');
      expect(row.getAttribute('data-reveal-highlight')).toBe('1');
      expect(row.querySelector('mat-checkbox')).toBeNull();

      nearView.bringNear();
      await fixture.whenStable();
      expect(row.getAttribute('data-reveal-highlight')).toBe('1');
      expect(row.querySelector('mat-checkbox bdi').textContent).toBe('photo.jpg');
    } finally {
      delete Element.prototype.scrollIntoView;
    }
  });

  it('selects one more photo on request, keeping the others selected, as a click on its checkbox does', async () => {
    const photos = ['/opened/a.jpg', '/opened/b.jpg', '/opened/c.jpg']
      .map(path => Object.assign(new Photo(), { name: path.split('/').pop(), path }));
    vi.spyOn(TestBed.inject(PhotoDataService), 'getPhoto').mockImplementation(path => photos.find(each => each.path === path) ?? null);
    const selectable = (path: string, children: NestedNode[] = []) => Object.assign(node(path, children), { isSelectable: true });
    dataService.dataReplaced.next([selectable('/opened', photos.map(each => selectable(each.path)))]);
    await fixture.whenStable();
    const selectionService = TestBed.inject(DirectoryTreeViewSelectionService);
    const selectedPhotoService = TestBed.inject(SelectedPhotoService);
    const selectedPaths = () => selectedPhotoService.selectedPhotos().map(each => each.path).sort();
    selectionService.select(['/opened/a.jpg']);
    expect(selectedPaths()).toEqual(['/opened/a.jpg']);

    selectionService.add('/opened/c.jpg');
    expect(selectedPaths()).toEqual(['/opened/a.jpg', '/opened/c.jpg']);

    // A photo that is selected already stays so.
    selectionService.add('/opened/a.jpg');
    expect(selectedPaths()).toEqual(['/opened/a.jpg', '/opened/c.jpg']);
    selectionService.add('/opened/b.jpg');
    await fixture.whenStable();
    expect(selectedPaths()).toEqual(['/opened/a.jpg', '/opened/b.jpg', '/opened/c.jpg']);
    expect(fixture.nativeElement.querySelector('mat-tree-node input[type=checkbox]').checked).toBe(true);
  });

  it('leaves the keys of Select Previous and Select Next to the Selection menu while a node has the focus', async () => {
    // Ctrl or Cmd with the Left or Right arrow key, which Electron gives the menu when the page leaves it unhandled.
    const folder = node('/folder', [node('/folder/photo.jpg')]);
    dataService.dataReplaced.next([folder]);
    await fixture.whenStable();
    document.body.appendChild(fixture.nativeElement);
    try {
      const folderNode = fixture.nativeElement.querySelector('mat-tree-node') as HTMLElement;
      folderNode.focus();
      expect(document.activeElement).toBe(folderNode);
      /** Presses a key on the folder's node, and says whether the page handled it. */
      async function press(key: string, modifiers: KeyboardEventInit = {}): Promise<boolean> {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers });
        folderNode.dispatchEvent(event);
        await fixture.whenStable();
        return event.defaultPrevented;
      }

      for (const modifiers of [{ ctrlKey: true }, { metaKey: true }]) {
        expect(await press('ArrowLeft', modifiers)).toBe(false);
        expect(tree.isExpanded(folder)).toBe(true);
      }
      // The arrow alone collapses and expands the node, as the CDK's tree does.
      expect(await press('ArrowLeft')).toBe(true);
      expect(tree.isExpanded(folder)).toBe(false);
      for (const modifiers of [{ ctrlKey: true }, { metaKey: true }]) {
        expect(await press('ArrowRight', modifiers)).toBe(false);
        expect(tree.isExpanded(folder)).toBe(false);
      }
      expect(await press('ArrowRight')).toBe(true);
      expect(tree.isExpanded(folder)).toBe(true);
      // The other arrows keep the CDK's keys, with Ctrl or Cmd too.
      expect(await press('ArrowDown', { ctrlKey: true })).toBe(true);
    } finally {
      fixture.nativeElement.remove();
    }
  });
});

describe('DirectoryTreeViewComponent, as Angular checks it after a change of the selection', () => {
  let fixture: ComponentFixture<DirectoryTreeViewComponent>;
  let rowOf: (name: string) => HTMLElement;
  let checkboxOf: (name: string) => HTMLInputElement;
  let stateOf: ReturnType<typeof vi.spyOn>;
  let revealHighlightOf: ReturnType<typeof vi.spyOn>;
  /** The names of the nodes whose rows read their states, which their components do when Angular checks them. */
  const statesRead = () => new Set(stateOf.mock.calls.map(([each]) => (each as NestedNode).name));
  const selectable = (path: string, children: NestedNode[] = []) => Object.assign(node(path, children), { isSelectable: true });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryTreeViewComponent],
      providers: [{ provide: NearViewService, useValue: new NearViewDouble() }],
    })
      .overrideComponent(DirectoryTreeViewComponent, {
        remove: { imports: [PhotoInfoViewerComponent] },
        add: { imports: [DummyPhotoInfoViewerComponent] },
      })
      // OnPush, Angular's default, which the application's build gives it: an override makes a component's metadata
      // again, with the strategy that checks it whenever its parent is checked, and the development mode's check
      // after each change detection would then go through every row.
      .overrideComponent(DirectoryTreeViewComponent, { set: { changeDetection: ChangeDetectionStrategy.OnPush } })
      .compileComponents();
    fixture = TestBed.createComponent(DirectoryTreeViewComponent);
    await fixture.whenStable();
    vi.spyOn(TestBed.inject(PhotoDataService), 'getPhoto').mockImplementation(path => ({ path }) as Photo);
    const photos = ['/folder/a.jpg', '/folder/b.jpg', '/folder/c.jpg'].map(path => selectable(path));
    TestBed.inject(DirectoryTreeViewDataService).dataReplaced.next([selectable('/folder', photos)]);
    await fixture.whenStable();
    rowOf = name => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('mat-tree-node'))
      .find(row => row.querySelector('bdi').textContent === name);
    checkboxOf = name => rowOf(name).querySelector<HTMLInputElement>('input[type="checkbox"]');
    stateOf = vi.spyOn(fixture.debugElement.injector.get(DirTreeViewNodeSelection), 'stateOf');
    // The tree's template reads it for each file's row, which Angular checks with the row's node.
    revealHighlightOf = vi.spyOn(fixture.componentInstance, 'revealHighlightOf');
  });

  it('by a click on a photo\'s checkbox checks every row\'s node, as an event in the tree does, and the changed rows only', async () => {
    checkboxOf('b.jpg').click();
    await fixture.whenStable();

    expect(statesRead()).toEqual(new Set(['b.jpg', 'folder']));
    expect(new Set(revealHighlightOf.mock.calls.map(([each]) => (each as NestedNode).name))).toEqual(new Set(['a.jpg', 'b.jpg', 'c.jpg']));
    expect(checkboxOf('b.jpg').checked).toBe(false);
    expect(checkboxOf('folder').indeterminate).toBe(true);
    expect(TestBed.inject(SelectedPhotoService).selectedPhotos().map(each => each.path)).toEqual(['/folder/a.jpg', '/folder/c.jpg']);
  });

  it('requested outside the tree checks no row\'s node, and the rows that it changes only', async () => {
    // As Undo and Redo in the Selection menu, the map and the chart request one.
    TestBed.inject(DirectoryTreeViewSelectionService).select(['/folder/a.jpg', '/folder/c.jpg']);
    await fixture.whenStable();

    expect(statesRead()).toEqual(new Set(['b.jpg', 'folder']));
    expect(revealHighlightOf).not.toHaveBeenCalled();
    expect(checkboxOf('a.jpg').checked).toBe(true);
    expect(checkboxOf('b.jpg').checked).toBe(false);
    expect(checkboxOf('folder').indeterminate).toBe(true);
  });
});
