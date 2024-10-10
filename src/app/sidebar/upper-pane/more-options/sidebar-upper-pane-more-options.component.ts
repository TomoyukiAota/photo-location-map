import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IconDataUrl } from '../../../../assets/icon-data-url';
import { DirectoryTreeViewSortService } from '../../../directory-tree-view/directory-tree-view-sort.service';
import {
  DirectoryTreeViewSortDirection,
  DirectoryTreeViewSortKey,
} from '../../../directory-tree-view/directory-tree-view-sort-config';

@Component({
  selector: 'app-sidebar-upper-pane-more-options',
  templateUrl: './sidebar-upper-pane-more-options.component.html',
  styleUrl: './sidebar-upper-pane-more-options.component.scss'
})
export class SidebarUpperPaneMoreOptionsComponent {
  constructor(public sortService: DirectoryTreeViewSortService,
              private sanitizer: DomSanitizer,
  ) {
  }

  public get moreOptionsIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.moreOptions); }

  public handleSortKeyMenuItemClicked(sortKey: DirectoryTreeViewSortKey) {
    this.sortService.sortKey$.next(sortKey);
  }

  public handleSortDirectionMenuItemClicked(sortDirection: DirectoryTreeViewSortDirection) {
    this.sortService.sortDirection$.next(sortDirection);
  }
}
