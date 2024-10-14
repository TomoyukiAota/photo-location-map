import { Component } from '@angular/core';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../../src-shared/log/logger';
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
    Logger.info(`[Sidebar] [Menu] [Sort] Clicked "By ${sortKey}"`);
    Analytics.trackEvent('Sidebar Menu', `[Sort] Clicked "By ${sortKey}"`);
    this.sortService.sortKey$.next(sortKey);
  }

  public handleShootingTimeInfoButtonClicked(event: MouseEvent) {
    Logger.info(`[Sidebar] [Menu] [Sort] Clicked Shooting Time Info`);
    Analytics.trackEvent('Sidebar Menu', `[Sort] Clicked Shooting Time Info`);
    event.stopPropagation();
    this.sortService.showShootingTimeInfoDialog();
  }

  public handleSortDirectionMenuItemClicked(sortDirection: DirTreeViewSortDirection) {
    Logger.info(`[Sidebar] [Menu] [Sort] Clicked "${sortDirection}"`);
    Analytics.trackEvent('Sidebar Menu', `[Sort] Clicked "${sortDirection}"`);
    this.sortService.sortDirection$.next(sortDirection);
  }
}
