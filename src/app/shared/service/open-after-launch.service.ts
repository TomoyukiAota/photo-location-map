import * as fsExtra from 'fs-extra';
import * as pathModule from 'path';
import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { CommandLineOptions } from '../../../../src-shared/command-line-options/command-line-options';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { Logger } from '../../../../src-shared/log/logger';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { OpenFolderService } from './open-folder.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Injectable({
  providedIn: 'root'
})
export class OpenAfterLaunchService {
  constructor(private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private openFolderService: OpenFolderService,
              private photoDataService: PhotoDataService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService,
  ) { }

  public async openAfterLaunchIfNeeded() {
    const commandLineOptions = await this.getCommandLineOptionsFromMainProcess();
    const specifiedPath = commandLineOptions.open;
    if (!specifiedPath) { return; }
    await this.openAfterLaunch(specifiedPath);
  }

  private async openAfterLaunch(specifiedPath: string) {
    Logger.info(`[Open After Launch] Opening "${specifiedPath}"`);
    Analytics.trackEvent('Open After Launch', 'Open After Launch', 'Opening Item');
    const stats = await fsExtra.stat(specifiedPath);
    if (stats.isFile()) {
      Logger.info(`[Open After Launch] The specified item is a file. Opening the parent folder and then selecting the file.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: File', 'Item Type: File');
      const parentFolderPath = pathModule.dirname(specifiedPath);
      await this.openFolderService.open(parentFolderPath);
      this.photoSelectionHistoryService.reset(); // Remove the unnecessary history of selecting all photos as a result of opening the parent folder.
      const gpsInfoExistsInSpecifiedFile = this.photoDataService.getPhotoPathsWithGpsInfo().includes(specifiedPath);
      if (gpsInfoExistsInSpecifiedFile) {
        this.directoryTreeViewSelectionService.select([specifiedPath]);
      } else {
        this.directoryTreeViewSelectionService.select([]); // Deselect all photos if the specified file does not have GPS info.
      }
    } else if (stats.isDirectory()) {
      Logger.info(`[Open After Launch] The specified item is a directory. Opening the directory.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: Directory', 'Item Type: Directory');
      await this.openFolderService.open(specifiedPath);
    } else {
      Logger.error(`[Open After Launch] The specified item is neither a file nor a directory, which is unexpected.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: Unexpected', 'Item Type: Unexpected');
    }
  }

  private async getCommandLineOptionsFromMainProcess(): Promise<CommandLineOptions> {
    return await ipcRenderer.invoke(IpcConstants.CommandLineOptions.Get);
  }
}
