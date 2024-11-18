import { Component } from '@angular/core';
import * as remote from '@electron/remote';
import { OpenPathService } from '../../shared/service/open-path.service';
import { ThumbnailGenerationService } from '../../thumbnail-generation/service/thumbnail-generation.service';

@Component({
  selector: 'app-sidebar-upper-pane',
  templateUrl: './sidebar-upper-pane.component.html',
  styleUrl: './sidebar-upper-pane.component.scss'
})
export class SidebarUpperPaneComponent {
  constructor(private openPathService: OpenPathService,
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
    await this.openPathService.open(openedFolderPath);
  }
}
