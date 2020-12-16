import * as fs from 'fs';
import * as pathModule from 'path';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { openWithAssociatedApp } from '../../../src-shared/command/command';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';


export class PlayLivePhotosIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const parsedPath = pathModule.parse(photo.path);
    const livePhotosFilePath = pathModule.join(parsedPath.dir, parsedPath.name + '.MOV');
    if (!fs.existsSync(livePhotosFilePath))
      return null;

    const element = document.createElement('img');
    element.src = IconDataUrl.play;
    element.width = 25;
    element.height = 25;
    element.title = 'Live Photos';
    element.className = 'photo-info-viewer-button';
    element.onclick = () => this.handlePlayLivePhotosIconClick(livePhotosFilePath, photo);
    return element;
  }

  private static handlePlayLivePhotosIconClick(livePhotosFilePath: string, photo: Photo): void {
    logger.info(`Clicked the play live photos icon for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Play Live Photos Icon');
    openWithAssociatedApp(livePhotosFilePath);
  }
}
