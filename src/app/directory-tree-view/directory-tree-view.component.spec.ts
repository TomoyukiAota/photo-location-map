import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTree } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
import { Photo } from '../shared/model/photo.model';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { PhotoRevealService } from '../shared/service/photo-reveal.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectoryTreeViewComponent],
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
});
