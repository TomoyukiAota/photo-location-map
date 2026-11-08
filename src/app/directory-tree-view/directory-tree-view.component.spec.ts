import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTree } from '@angular/material/tree';
import { By } from '@angular/platform-browser';
import { DirTreeViewPhotoInfoComponent } from './dir-tree-view-photo-info/dir-tree-view-photo-info.component';
import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';
import { DirectoryTreeViewComponent } from './directory-tree-view.component';
import { NestedNode } from './directory-tree-view.model';

// A photo's information is covered by the application E2E suite.
@Component({ selector: 'app-dir-tree-view-photo-info', template: '' })
class DummyDirTreeViewPhotoInfoComponent {
  public readonly photoPath = input<string>();
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
        remove: { imports: [DirTreeViewPhotoInfoComponent] },
        add: { imports: [DummyDirTreeViewPhotoInfoComponent] },
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
});
