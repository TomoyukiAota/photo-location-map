import { ChangeDetectorRef, Component } from '@angular/core';

import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  readonly messageWhenFolderIsNotSelected = 'The selected folder will be displayed here.';
  selectedFolderPath = '';

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private electronService: ElectronService) {
  }

  showSelectFolderDialog() {
    this.electronService.remote.dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
      },
      (folderPaths) => {
        if (!folderPaths)
          return;

        this.selectedFolderPath = folderPaths[0];
        this.changeDetectorRef.detectChanges();
      }
    );
  }
}
