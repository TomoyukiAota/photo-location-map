import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NearViewDirective } from '../../shared/near-view/near-view.directive';
import { NestedNode } from '../directory-tree-view.model';
import { DirTreeViewCheckboxAndNameComponent } from './dir-tree-view-checkbox-and-name.component';

/** A file's node of the tree. */
function fileNode(name: string, isSelectable: boolean): NestedNode {
  return Object.assign(new NestedNode(), { name, path: `/photos/${name}`, type: 'file', fsStats: undefined, isSelectable, children: [] });
}

describe('DirTreeViewCheckboxAndNameComponent', () => {
  /** Whether the row is near what is shown, as the row's NearViewDirective tells. */
  const near = signal(false);
  let fixture: ComponentFixture<DirTreeViewCheckboxAndNameComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    near.set(false);
    TestBed.configureTestingModule({ providers: [{ provide: NearViewDirective, useValue: { isNear: near.asReadonly() } }] });
  });

  async function show(node: NestedNode, selected: boolean): Promise<void> {
    fixture = TestBed.createComponent(DirTreeViewCheckboxAndNameComponent);
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('selected', selected);
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

  it('tells of a click on the checkbox, and shows the selection that it is given', async () => {
    near.set(true);
    await show(fileNode('IMG_0001.JPG', true), false);
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);
    const checkbox = element.querySelector<HTMLInputElement>('mat-checkbox input');
    expect(checkbox.checked).toBe(false);

    checkbox.click();
    expect(toggled).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('selected', true);
    await fixture.whenStable();

    expect(checkbox.checked).toBe(true);
  });

  it('shows a grey box in place of the checkbox of a file that nothing can select, whether or not the row is near', async () => {
    await show(fileNode('IMG_0001.MOV', false), false);

    expect(element.querySelector('mat-checkbox')).toBeNull();
    expect(element.querySelector('.non-selectable-node .disabled-checkbox-alternative')).not.toBeNull();
    expect(element.querySelector('.non-selectable-node-name').textContent).toBe('IMG_0001.MOV');
  });
});
