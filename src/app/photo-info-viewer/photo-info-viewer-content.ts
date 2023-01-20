import { DevOrProd } from '../../../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from '../shared/model/photo.model';
import { MoreOptionsButton } from './button/more-options-button';
import { LaunchPhotoViewerButton } from './button/launch-photo-viewer-button';
import { PlayLivePhotosButton } from './button/play-live-photos-button';
import { RotateButton } from './button/rotate-button';
import { PhotoInfoUnavailableElement } from './photo-info-unavailable-element';
import { ThumbnailElement } from './thumbnail-element';

type Requester = 'dir-tree-view' | 'leaflet-map-div-icon' | 'leaflet-map-popup' | 'google-maps';
type PhotoPath = string;

export class PhotoInfoViewerContent {
  private static rootElementCache = new Map<Requester, Map<PhotoPath, HTMLDivElement>>();

  public static clearCache() {
    this.rootElementCache.clear();
    this.rootElementCache.set('dir-tree-view'       , new Map<PhotoPath, HTMLDivElement>());
    this.rootElementCache.set('leaflet-map-div-icon', new Map<PhotoPath, HTMLDivElement>());
    this.rootElementCache.set('leaflet-map-popup'   , new Map<PhotoPath, HTMLDivElement>());
    this.rootElementCache.set('google-maps'         , new Map<PhotoPath, HTMLDivElement>());
  }

  public static generateCache(photos: Photo[]) {
    const startTime = performance.now();

    photos.forEach(photo => {
      this.rootElementCache.get('dir-tree-view'       ).set(photo.path, this.generateRootElement(photo));
      this.rootElementCache.get('leaflet-map-div-icon').set(photo.path, this.generateRootElement(photo));
      this.rootElementCache.get('leaflet-map-popup'   ).set(photo.path, this.generateRootElement(photo));
    });

    // Cache for google-maps is available only in development environment because
    // 1) google-maps is available only in development environment, and
    // 2) generating cache takes time.
    if (DevOrProd.isDev) {
      photos.forEach(photo => {
        this.rootElementCache.get('google-maps').set(photo.path, this.generateRootElement(photo));
      });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    Logger.info(`[PhotoInfoViewerContent] generateCache took ${duration.toFixed(3)} [ms].`);
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

    const cachedElement = this.rootElementCache.get(requester).get(photo.path);
    return cachedElement;
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
    const dateTimeTaken = photo?.exif?.dateTimeOriginal?.toDateTimeString();
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
