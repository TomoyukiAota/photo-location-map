import { Component } from '@angular/core';
import { DirTreeViewSortService } from '../../../directory-tree-view/dir-tree-view-sort/dir-tree-view-sort.service';
import {
  DirTreeViewSortDirection,
  DirTreeViewSortKey,
} from '../../../directory-tree-view/dir-tree-view-sort/dir-tree-view-sort-config';

@Component({
  selector: 'app-sidebar-upper-pane-more-options',
  templateUrl: './sidebar-upper-pane-more-options.component.html',
  styleUrl: './sidebar-upper-pane-more-options.component.scss'
})
export class SidebarUpperPaneMoreOptionsComponent {
  constructor(public sortService: DirTreeViewSortService,
  ) {
  }

  public handleSortKeyMenuItemClicked(sortKey: DirTreeViewSortKey) {
    this.sortService.sortKey$.next(sortKey);
  }

  public handleShootingTimeInfoButtonClicked(event: MouseEvent) {
    event.stopPropagation();
    this.sortService.showShootingTimeInfoDialog();
  }

  public handleSortDirectionMenuItemClicked(sortDirection: DirTreeViewSortDirection) {
    this.sortService.sortDirection$.next(sortDirection);
  }
}
