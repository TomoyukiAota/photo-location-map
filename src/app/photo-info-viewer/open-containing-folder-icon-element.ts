import { Analytics } from '../../../src-shared/analytics/analytics';
import { openContainingFolder } from '../../../src-shared/command/command';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';

export class OpenContainingFolderIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src = IconDataUrl.folder;
    element.width = 25;
    element.height = 25;
    element.title = 'Open Folder';
    element.className = 'photo-info-viewer-button';
    element.onclick = () => this.handleOpenContainingFolderIconClick(photo);
    return element;
  }

  private static handleOpenContainingFolderIconClick(photo: Photo): void {
    logger.info(`Clicked the open folder icon for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Open Folder Icon');
    openContainingFolder(photo.path);
  }
}
