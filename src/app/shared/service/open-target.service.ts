import { inject, Service } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import type { OpenTarget } from '../../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../../src-shared/log/logger';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { OpenFolderService } from './open-folder.service';
import { PhotoDataService } from './photo-data.service';
import { PhotoSelectionHistoryService } from './photo-selection-history.service';

/** A folder, or a file, that the main process found at a path given to the app (src-main/open-target/). */
export type OpenableTarget = Extract<OpenTarget, { kind: 'file' | 'directory' }>;

/** How the path was given to the app: what its log lines and analytics events are named after. */
export type OpenTargetSource = 'Open After Launch' | 'Drop to Open';

/**
 * Opens what a path given to the app names: that of --open (OpenAfterLaunchService), or that of a dropped item
 * (DropToOpenService).
 */
@Service()
export class OpenTargetService {
  private directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private openFolderService = inject(OpenFolderService);
  private photoDataService = inject(PhotoDataService);
  private photoSelectionHistoryService = inject(PhotoSelectionHistoryService);

  /**
   * Opens a folder, which selects all of its photos, as Open Folder does; or the folder of a file, with only the file
   * selected if it has a location, and nothing selected otherwise.
   */
  public async open(target: OpenableTarget, source: OpenTargetSource) {
    if (target.kind === 'file') {
      Logger.info(`[${source}] The specified item is a file. Opening the parent folder and then selecting the file.`);
      Analytics.trackEvent(source, `${source}: File`, 'Item Type: File');
      await this.openFolderService.open(target.parentFolderPath);
      this.photoSelectionHistoryService.reset(); // Remove the unnecessary history of selecting all photos as a result of opening the parent folder.
      const gpsInfoExistsInSpecifiedFile = this.photoDataService.getPhotoPathsWithGpsInfo().includes(target.path);
      if (gpsInfoExistsInSpecifiedFile) {
        this.directoryTreeViewSelectionService.select([target.path]);
      } else {
        this.directoryTreeViewSelectionService.select([]); // Deselect all photos if the specified file does not have GPS info.
      }
    } else {
      Logger.info(`[${source}] The specified item is a directory. Opening the directory.`);
      Analytics.trackEvent(source, `${source}: Directory`, 'Item Type: Directory');
      await this.openFolderService.open(target.path);
    }
  }
}
