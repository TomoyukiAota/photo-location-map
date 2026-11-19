import { Component, inject, input, output } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatLabel } from '@angular/material/form-field';
import { DirTreeViewNodeSelection } from '../dir-tree-view-node-selection';
import { NestedNode } from '../directory-tree-view.model';

/**
 * The checkbox and the name in a folder's row of the folder tree, after the button that expands the folder: checked
 * when all of the folder's photos that can be selected are selected, all the way down, and partly when some are. For
 * a folder that nothing in can be selected, a grey box in place of the checkbox.
 * TL;DR: It reads its folder's state itself, so that a change of the selection has Angular check only the rows that
 * it changes, as DirTreeViewCheckboxAndNameComponent does for a file's row.
 * Details: Its element lays out nothing of its own, so that the checkbox is laid out in the row as it was in the
 * tree's template, before it was a component.
 */
@Component({
  selector: 'app-dir-tree-view-folder-checkbox-and-name',
  templateUrl: './dir-tree-view-folder-checkbox-and-name.component.html',
  styleUrl: './dir-tree-view-folder-checkbox-and-name.component.scss',
  imports: [MatCheckbox, MatLabel],
})
export class DirTreeViewFolderCheckboxAndNameComponent {
  public readonly node = input.required<NestedNode>();
  /** A click on the checkbox, which selects the folder's photos or deselects them. */
  public readonly toggled = output<void>();

  protected readonly selection = inject(DirTreeViewNodeSelection);
}
