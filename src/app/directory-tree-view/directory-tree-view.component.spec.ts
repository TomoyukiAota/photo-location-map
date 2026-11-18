import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTree } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
import { Photo } from '../shared/model/photo.model';
import { NearViewService } from '../shared/near-view/near-view.service';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { DirectoryTreeViewComponent } from './directory-tree-view.component';
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
