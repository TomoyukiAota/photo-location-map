import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dir-tree-view-sort-shooting-time-info',
  templateUrl: './dir-tree-view-sort-shooting-time-info.component.html',
  styleUrl: './dir-tree-view-sort-shooting-time-info.component.scss',
  standalone: false
})
export class DirTreeViewSortShootingTimeInfoComponent {
  public readonly detailsOpenState = signal(false);
}
