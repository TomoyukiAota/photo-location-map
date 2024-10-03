import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IconDataUrl } from '../../../../assets/icon-data-url';
import { DirectoryTreeViewSortService } from '../../../directory-tree-view/directory-tree-view-sort.service';

@Component({
  selector: 'app-sidebar-upper-pane-more-options',
  templateUrl: './sidebar-upper-pane-more-options.component.html',
  styleUrl: './sidebar-upper-pane-more-options.component.scss'
})
export class SidebarUpperPaneMoreOptionsComponent {
  constructor(private directoryTreeViewSortService: DirectoryTreeViewSortService,
              private sanitizer: DomSanitizer,
  ) {
  }

  public get moreOptionsIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.moreOptions); }

  public sortDirectoryTreeViewByName() {
    this.directoryTreeViewSortService.requestSortingData({key: 'Name', direction: 'Ascending'});
  }

  public sortDirectoryTreeViewByShootingTime() {
    this.directoryTreeViewSortService.requestSortingData({key: 'ShootingDateTime', direction: 'Ascending'});
  }
}
