import { Analytics } from '../../../src-shared/analytics/analytics';
import { openContainingFolder } from '../../../src-shared/command/command';
import { Logger } from '../../../src-shared/log/logger';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';

export class OpenContainingFolderIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src = IconDataUrl.folder;
    element.width = 25;
    element.height = 25;
    element.title = 'Open containing folder';
    element.className = 'photo-info-viewer-button';
    element.onclick = () => this.handleOpenContainingFolderIconClick(photo);
    return element;
  }

  private static handleOpenContainingFolderIconClick(photo: Photo): void {
    Logger.info(`Photo Info Viewer: Clicked the open containing folder icon for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Open Containing Folder Icon');
    openContainingFolder(photo.path);
  }
}
