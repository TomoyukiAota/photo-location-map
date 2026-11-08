import { Component, inject } from '@angular/core';
import { OpenFolderService } from '../../shared/service/open-folder.service';
import { DirectoryTreeViewComponent } from '../../directory-tree-view/directory-tree-view.component';

@Component({
  selector: 'app-sidebar-lower-pane',
  templateUrl: './sidebar-lower-pane.component.html',
  styleUrl: './sidebar-lower-pane.component.scss',
  imports: [DirectoryTreeViewComponent]
})
export class SidebarLowerPaneComponent {
  public openFolderService = inject(OpenFolderService);
}
