import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-dir-tree-view-sort-shooting-time-info',
  templateUrl: './dir-tree-view-sort-shooting-time-info.component.html',
  styleUrl: './dir-tree-view-sort-shooting-time-info.component.scss',
  imports: [MatButton, MatIcon, MatDialogClose]
})
export class DirTreeViewSortShootingTimeInfoComponent {
  public readonly detailsOpenState = signal(false);
}
