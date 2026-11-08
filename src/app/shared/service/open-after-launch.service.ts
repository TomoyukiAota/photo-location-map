import { inject, Service } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { bridge, OpenTarget } from '../../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../../src-shared/log/logger';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { OpenFolderService } from './open-folder.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

@Service()
export class OpenAfterLaunchService {
  private directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private openFolderService = inject(OpenFolderService);
  private photoDataService = inject(PhotoDataService);
  private photoSelectionHistoryService = inject(PhotoSelectionHistoryService);

  public async openAfterLaunchIfNeeded() {
    // The main process reads `--open`, and finds out what the path is.
    const target = await bridge().commandLine.openTarget();
    if (target.kind === 'none') { return; }
    await this.openAfterLaunch(target);
  }

  private async openAfterLaunch(target: Exclude<OpenTarget, { kind: 'none' }>) {
    const specifiedPath = target.path;
    Logger.info(`[Open After Launch] Opening "${specifiedPath}"`);
    Analytics.trackEvent('Open After Launch', 'Open After Launch', 'Opening Item');
    if (target.kind === 'failed') {
      throw new Error(target.message);
    } else if (target.kind === 'file') {
      Logger.info(`[Open After Launch] The specified item is a file. Opening the parent folder and then selecting the file.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: File', 'Item Type: File');
      await this.openFolderService.open(target.parentFolderPath);
      this.photoSelectionHistoryService.reset(); // Remove the unnecessary history of selecting all photos as a result of opening the parent folder.
      const gpsInfoExistsInSpecifiedFile = this.photoDataService.getPhotoPathsWithGpsInfo().includes(specifiedPath);
      if (gpsInfoExistsInSpecifiedFile) {
        this.directoryTreeViewSelectionService.select([specifiedPath]);
      } else {
        this.directoryTreeViewSelectionService.select([]); // Deselect all photos if the specified file does not have GPS info.
      }
    } else if (target.kind === 'directory') {
      Logger.info(`[Open After Launch] The specified item is a directory. Opening the directory.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: Directory', 'Item Type: Directory');
      await this.openFolderService.open(specifiedPath);
    } else {
      Logger.error(`[Open After Launch] The specified item is neither a file nor a directory, which is unexpected.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: Unexpected', 'Item Type: Unexpected');
    }
  }
}
