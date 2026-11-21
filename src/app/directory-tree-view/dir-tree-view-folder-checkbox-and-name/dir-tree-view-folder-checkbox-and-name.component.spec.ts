import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirTreeViewNodeSelection } from '../dir-tree-view-node-selection';
import { NestedNode } from '../directory-tree-view.model';
import { DirTreeViewFolderCheckboxAndNameComponent } from './dir-tree-view-folder-checkbox-and-name.component';

function node(path: string, isSelectable: boolean, children: NestedNode[] = []): NestedNode {
  return Object.assign(new NestedNode(), { name: path.split('/').pop(), path, type: children.length > 0 ? 'directory' : 'file',
    fsStats: undefined, isSelectable, children });
}

describe('DirTreeViewFolderCheckboxAndNameComponent', () => {
  let selection: DirTreeViewNodeSelection;
  let fixture: ComponentFixture<DirTreeViewFolderCheckboxAndNameComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DirTreeViewNodeSelection] });
    selection = TestBed.inject(DirTreeViewNodeSelection);
  });

  async function show(folder: NestedNode): Promise<void> {
    selection.replace([folder]);
    fixture = TestBed.createComponent(DirTreeViewFolderCheckboxAndNameComponent);
    fixture.componentRef.setInput('node', folder);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  it('shows whether all of the folder\'s photos are selected, or some, whenever the selection changes', async () => {
    const [a, b] = [node('/photos/a.jpg', true), node('/photos/b.jpg', true)];
    const folder = node('/photos', true, [a, b]);
    await show(folder);
    const checkbox = element.querySelector<HTMLInputElement>('mat-checkbox input');
    const shown = () => ({ checked: checkbox.checked, indeterminate: checkbox.indeterminate });
    expect(element.querySelector('mat-checkbox bdi').textContent).toBe('photos');
    expect(shown()).toEqual({ checked: false, indeterminate: false });

    selection.toggle(a);
    await fixture.whenStable();
    expect(shown()).toEqual({ checked: false, indeterminate: true });

    selection.toggle(b);
    await fixture.whenStable();
    expect(shown()).toEqual({ checked: true, indeterminate: false });

    // As Undo in the Selection menu deselects them, outside any event of the page.
    selection.selectOnly([]);
    await fixture.whenStable();
    expect(shown()).toEqual({ checked: false, indeterminate: false });
  });

  it('tells of a click on the checkbox', async () => {
    await show(node('/photos', true, [node('/photos/a.jpg', true)]));
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);

    element.querySelector<HTMLInputElement>('mat-checkbox input').click();

    expect(toggled).toHaveBeenCalledTimes(1);
  });

  it('shows a grey box in place of the checkbox of a folder that nothing in can be selected', async () => {
    await show(node('/movies', false, [node('/movies/a.mov', false)]));

    expect(element.querySelector('mat-checkbox')).toBeNull();
    expect(element.querySelector('.non-selectable-node .disabled-checkbox-alternative')).not.toBeNull();
    expect(element.querySelector('.non-selectable-node bdi').textContent).toBe('movies');
  });

  it('leaves the checkbox out of the order of the Tab key in a copy of the row, as one kept at the top of the tree', async () => {
    await show(node('/photos', true, [node('/photos/a.jpg', true)]));
    const input = () => element.querySelector<HTMLInputElement>('mat-checkbox input');
    expect(input().tabIndex).toBe(0);
    fixture.componentRef.setInput('focusable', false);
    await fixture.whenStable();
    expect(input().tabIndex).toBe(-1);
  });
});
