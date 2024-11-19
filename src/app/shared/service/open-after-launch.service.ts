import * as fsExtra from 'fs-extra';
import * as pathModule from 'path';
import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { CommandLineOptions } from '../../../../src-shared/command-line-options/command-line-options';
import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';
import { Logger } from '../../../../src-shared/log/logger';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { OpenPathService } from './open-path.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Injectable({
  providedIn: 'root'
})
export class OpenAfterLaunchService {
  constructor(private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private openPathService: OpenPathService,
              private photoDataService: PhotoDataService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService,
  ) { }

  public async openAfterLaunchIfNeeded() {
    const commandLineOptions = await this.getCommandLineOptionsFromMainProcess();
    console.log('commandLineOptions', commandLineOptions);
    const specifiedPath = commandLineOptions.open;
    if (specifiedPath) {
      const stats = await fsExtra.stat(specifiedPath);
      if (stats.isFile()) {
        const parentFolderPath = pathModule.dirname(specifiedPath);
        await this.openPathService.open(parentFolderPath);
        this.photoSelectionHistoryService.reset(); // Remove the unnecessary history of selecting all photos as a result of opening the parent folder.
        const gpsInfoExistsInSpecifiedFile = this.photoDataService.getPhotoPathsWithGpsInfo().includes(specifiedPath);
        if (gpsInfoExistsInSpecifiedFile) {
          this.directoryTreeViewSelectionService.select([specifiedPath]);
        } else {
          this.directoryTreeViewSelectionService.select([]); // Deselect all photos if the specified file does not have GPS info.
        }
      } else if (stats.isDirectory()) {
        await this.openPathService.open(specifiedPath);
      } else {
        Logger.error(`The specified item is neither a file nor a directory, which is unexpected. Path: "${specifiedPath}"`);
      }
    }
  }

  private async getCommandLineOptionsFromMainProcess(): Promise<CommandLineOptions> {
    return await ipcRenderer.invoke(IpcConstants.CommandLineOptions.Get);
  }
}
