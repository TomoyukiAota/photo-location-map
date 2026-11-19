import { Component, inject, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatLabel } from '@angular/material/form-field';
import { NearViewDirective } from '../../shared/near-view/near-view.directive';
import { DirTreeViewNodeSelection } from '../dir-tree-view-node-selection';
import { NestedNode } from '../directory-tree-view.model';

/**
 * The checkbox and the name in a file's row of the folder tree; for a file that nothing can select, a grey box in
 * place of the checkbox.
 * TL;DR: A photo's row makes its checkbox, with the disabled button before it, only once the row comes near the part
 * of the tree that is shown; until then, it has their room, with the name where the checkbox has it. It reads whether
 * its photo is selected itself, so that a change of the selection has Angular check only the rows that it changes.
 * Details:
 * - A folder that is expanded can have thousands of rows, and the checkbox with its button was about 40% of what
 *   making a row took, once the photo's viewer waited too (docs/tasks/20261119_lazy-tree-rows/STATUS.md).
 * - This is a component of its own so that it reads whether the row is near (the row's NearViewDirective) and whether
 *   its photo is selected (DirTreeViewNodeSelection) in its own template, for the reason that the directive's comment
 *   gives (docs/tasks/20261119_checkbox-checks-changed-rows/STATUS.md).
 */
@Component({
  selector: 'app-dir-tree-view-checkbox-and-name',
  templateUrl: './dir-tree-view-checkbox-and-name.component.html',
  styleUrl: './dir-tree-view-checkbox-and-name.component.scss',
  imports: [MatIconButton, MatCheckbox, MatLabel],
})
export class DirTreeViewCheckboxAndNameComponent {
  public readonly node = input.required<NestedNode>();
  /** A click on the checkbox, which selects the file or deselects it. */
  public readonly toggled = output<void>();

  protected readonly nearView = inject(NearViewDirective);
  protected readonly selection = inject(DirTreeViewNodeSelection);
}
