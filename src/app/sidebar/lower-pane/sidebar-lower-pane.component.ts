import { Component, inject } from '@angular/core';
import { OpenFolderService } from '../../shared/service/open-folder.service';

@Component({
  selector: 'app-sidebar-lower-pane',
  templateUrl: './sidebar-lower-pane.component.html',
  styleUrl: './sidebar-lower-pane.component.scss',
  standalone: false
})
export class SidebarLowerPaneComponent {
  public openFolderService = inject(OpenFolderService);
}
