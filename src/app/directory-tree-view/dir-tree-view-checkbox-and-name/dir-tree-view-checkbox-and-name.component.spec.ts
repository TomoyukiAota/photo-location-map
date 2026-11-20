import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NearViewDirective } from '../../shared/near-view/near-view.directive';
import { DirTreeViewNodeSelection } from '../dir-tree-view-node-selection';
import { NestedNode } from '../directory-tree-view.model';
import { DirTreeViewCheckboxAndNameComponent } from './dir-tree-view-checkbox-and-name.component';

/** A file's node of the tree. */
function fileNode(name: string, isSelectable: boolean): NestedNode {
  return Object.assign(new NestedNode(), { name, path: `/photos/${name}`, type: 'file', fsStats: undefined, isSelectable, children: [] });
}

describe('DirTreeViewCheckboxAndNameComponent', () => {
  /** Whether the row is near what is shown, as the row's NearViewDirective tells. */
  const near = signal(false);
  let selection: DirTreeViewNodeSelection;
  let fixture: ComponentFixture<DirTreeViewCheckboxAndNameComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    near.set(false);
    TestBed.configureTestingModule({
      providers: [{ provide: NearViewDirective, useValue: { isNear: near.asReadonly() } }, DirTreeViewNodeSelection],
    });
    selection = TestBed.inject(DirTreeViewNodeSelection);
  });

  /** Shows the file's node, in a folder of its own, which is selected or not. */
  async function show(node: NestedNode, selected: boolean): Promise<void> {
    selection.replace([Object.assign(new NestedNode(), { name: 'photos', path: '/photos', type: 'directory', fsStats: undefined,
      isSelectable: node.isSelectable, children: [node] })]);
    if (selected)
      selection.toggle(node);
    fixture = TestBed.createComponent(DirTreeViewCheckboxAndNameComponent);
    fixture.componentRef.setInput('node', node);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  it('shows a photo\'s name beside the room of its checkbox, then the checkbox once the row comes near what is shown', async () => {
    await show(fileNode('IMG_0001.JPG', true), true);

    expect(element.querySelector('mat-checkbox')).toBeNull();
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('.room-of-checkbox')).not.toBeNull();
    expect(element.querySelector('bdi').textContent).toBe('IMG_0001.JPG');

    near.set(true);
    await fixture.whenStable();

    expect(element.querySelector('.room-of-checkbox')).toBeNull();
    expect(element.querySelector('button[disabled]')).not.toBeNull();
    expect(element.querySelector<HTMLInputElement>('mat-checkbox input').checked).toBe(true);
    expect(element.querySelector('mat-checkbox bdi').textContent).toBe('IMG_0001.JPG');
  });

  it('tells of a click on the checkbox, and shows its photo\'s selection whenever it changes', async () => {
    near.set(true);
    const node = fileNode('IMG_0001.JPG', true);
    await show(node, false);
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);
    const checkbox = element.querySelector<HTMLInputElement>('mat-checkbox input');
    expect(checkbox.checked).toBe(false);

    checkbox.click();
    expect(toggled).toHaveBeenCalledTimes(1);
    // The tree selects the photo on the click.
    selection.toggle(node);
    await fixture.whenStable();
    expect(checkbox.checked).toBe(true);

    // As Undo in the Selection menu deselects it, outside any event of the page.
    selection.selectOnly([]);
    await fixture.whenStable();
    expect(checkbox.checked).toBe(false);
  });

  it('shows a grey box in place of the checkbox of a file that nothing can select, whether or not the row is near', async () => {
    await show(fileNode('IMG_0001.MOV', false), false);

    expect(element.querySelector('mat-checkbox')).toBeNull();
    expect(element.querySelector('.non-selectable-node .disabled-checkbox-alternative')).not.toBeNull();
    expect(element.querySelector('.non-selectable-node bdi').textContent).toBe('IMG_0001.MOV');
  });
});
