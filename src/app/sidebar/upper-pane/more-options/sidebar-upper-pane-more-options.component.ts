import { Component, inject } from '@angular/core';
import { Analytics } from '../../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../../src-shared/log/logger';
import { DirTreeViewSortService } from '../../../directory-tree-view/dir-tree-view-sort/dir-tree-view-sort.service';
import {
  DirTreeViewSortDirection,
  DirTreeViewSortKey,
} from '../../../directory-tree-view/dir-tree-view-sort/dir-tree-view-sort-config';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/list';

@Component({
  selector: 'app-sidebar-upper-pane-more-options',
  templateUrl: './sidebar-upper-pane-more-options.component.html',
  styleUrl: './sidebar-upper-pane-more-options.component.scss',
  imports: [MatIconButton, MatMenuTrigger, MatIcon, MatMenu, MatMenuItem, MatDivider, TranslatePipe]
})
export class SidebarUpperPaneMoreOptionsComponent {
  public sortService = inject(DirTreeViewSortService);

  public handleSortKeyMenuItemClicked(sortKey: DirTreeViewSortKey) {
    Logger.info(`[Sidebar] [Menu] [Sort] Clicked "By ${sortKey}"`);
    Analytics.trackEvent('Sidebar Menu', `[Sort] Clicked "By ${sortKey}"`);
    this.sortService.setSortKey(sortKey);
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
    this.sortService.setSortDirection(sortDirection);
  }
}
