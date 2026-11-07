import { DevOrProd } from '../../../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from '../shared/model/photo.model';
import { MoreOptionsButton } from './button/more-options-button';
import { LaunchPhotoViewerButton } from './button/launch-photo-viewer-button';
import { PlayLivePhotosButton } from './button/play-live-photos-button';
import { RotateButton } from './button/rotate-button';
import { ElementCache } from './element-cache';
import { PhotoInfoUnavailableElement } from './photo-info-unavailable-element';
import { ThumbnailElement } from './thumbnail-element';

type Requester = 'dir-tree-view' | 'leaflet-map-tile' | 'leaflet-map-popup' | 'google-maps';

// The content showing a photo: its thumbnail, name, date and buttons. Each place that shows it gets an element of
// its own per photo, made the first time that place asks for it and then kept, so that the same element, with its
// rotation, is shown again until another folder is opened.
//
// They were made for every photo when a folder was opened, three per photo: for 40,000 photos, 2.4 million DOM nodes
// and 1.1 million event listeners, about half of the renderer's memory, of which a few are ever shown. Renderers
// ran out of memory seconds to minutes after folders of 13,000 to 49,000 photos were opened.
export class PhotoInfoViewerContent {
  private static readonly rootElementCache = new ElementCache<Requester, HTMLDivElement>();

  public static clearCache() {
    this.rootElementCache.clear();
  }

  public static request(requester: Requester, photo: Photo): HTMLDivElement {
    if (requester === 'google-maps' && !DevOrProd.isDev) {
      Logger.error(`[PhotoInfoViewerContent] google-maps is available only in development environment. DevOrProd: ${DevOrProd.toString()}`);
      return PhotoInfoUnavailableElement.get();
    }

    const isPhotoPathAvailable = !!photo?.path;
    if (!isPhotoPathAvailable) {
      Logger.error(`[PhotoInfoViewerContent] photo.path is not available. photo: ${photo}, photo?.name: ${photo?.name}`, photo);
      return PhotoInfoUnavailableElement.get();
    }

    return this.rootElementCache.get(requester, photo.path, () => this.generateRootElement(photo));
  }

  private static generateRootElement(photo: Photo) {
    const rootElement = document.createElement('div');
    rootElement.style.textAlign = 'center';
    this.appendToRootElement(rootElement, photo);
    return rootElement;
  }

  private static appendToRootElement(rootElement, photo: Photo) {
    const upperDiv = document.createElement('div');
    const lowerDiv = document.createElement('div');
    lowerDiv.className = 'photo-info-viewer-lower-div';
    rootElement.appendChild(upperDiv);
    rootElement.appendChild(lowerDiv);

    const { thumbnailElement, thumbnailContainerElement } = ThumbnailElement.create(photo);
    const nameElement = this.createNameElement(photo);
    const dateTimeTakenElement = this.createDateTimeTakenElement(photo);

    upperDiv.appendChild(thumbnailContainerElement);
    upperDiv.appendChild(nameElement);
    upperDiv.appendChild(dateTimeTakenElement);

    this.appendRotateButton(lowerDiv, thumbnailElement, photo);
    this.appendLaunchPhotoViewerButton(lowerDiv, photo);
    this.appendPlayLivePhotosButton(lowerDiv, photo);
    this.appendMoreOptionsButton(lowerDiv, photo);
  }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.className = 'photo-info-viewer-name';
    nameElement.innerText = photo.name;
    return nameElement;
  }

  private static createDateTimeTakenElement(photo: Photo) {
    const dateTimeTaken = photo?.exif?.dateTimeOriginal?.toDateTimeString({dayOfWeek: true});
    const dateTimeTakenElement = document.createElement('div');
    dateTimeTakenElement.className = 'photo-info-viewer-date-time-taken';
    dateTimeTakenElement.innerText = dateTimeTaken || '';
    return dateTimeTakenElement;
  }

  private static appendRotateButton(rootElement: HTMLDivElement, thumbnailElement: HTMLImageElement | Text, photo: Photo): void {
    if (thumbnailElement instanceof Text)
      return;

    const button = RotateButton.create(thumbnailElement, photo);
    rootElement.appendChild(button);
  }

  private static appendLaunchPhotoViewerButton(rootElement: HTMLDivElement, photo: Photo): void {
    const button = LaunchPhotoViewerButton.create(photo);
    rootElement.appendChild(button);
  }

  private static appendPlayLivePhotosButton(rootElement: HTMLDivElement, photo: Photo) {
    const button = PlayLivePhotosButton.create(photo);
    if (button) {
      rootElement.appendChild(button);
    }
  }

  private static appendMoreOptionsButton(rootElement: HTMLDivElement, photo: Photo) {
    const button = MoreOptionsButton.create(photo);
    if (button) {
      rootElement.appendChild(button);
    }
  }
}
