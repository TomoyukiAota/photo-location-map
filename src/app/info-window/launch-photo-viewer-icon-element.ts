import { Photo } from '../shared/model/photo.model';
import { IconDataUrl } from '../../assets/icon-data-url';
import { PhotoViewerLauncher } from '../photo-viewer/photo-viewer-launcher';

export class LaunchPhotoViewerIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src     = IconDataUrl.launchExternalApp;
    element.width = 25;
    element.height = 25;
    element.title = `Open ${photo.name}`;
    element.className = 'info-window-icon';
    element.onclick = () => PhotoViewerLauncher.launch(photo);
    return element;
  }
}
