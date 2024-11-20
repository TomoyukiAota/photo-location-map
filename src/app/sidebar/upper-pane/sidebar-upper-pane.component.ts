import { Component } from '@angular/core';
import * as remote from '@electron/remote';
import { OpenFolderService } from '../../shared/service/open-folder.service';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';

@Component({
  selector: 'app-sidebar-upper-pane',
  templateUrl: './sidebar-upper-pane.component.html',
  styleUrl: './sidebar-upper-pane.component.scss'
})
export class SidebarUpperPaneComponent {
  constructor(private openFolderService: OpenFolderService,
              public thumbnailGenerationService: ThumbnailGenerationService,
  ) {
  }

  public async showOpenFolderDialog() {
    const result = await remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        properties: ['openDirectory'],
      }
    );

    const isCanceled = result.filePaths.length === 0;
    if (isCanceled)
      return;

    const openedFolderPath = result.filePaths[0];
    await this.openFolderService.open(openedFolderPath);
  }
}
