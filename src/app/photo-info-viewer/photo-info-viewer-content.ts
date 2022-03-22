import { DevOrProd } from '../../../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from '../shared/model/photo.model';
import { MoreOptionsIconElement } from './more-options/more-options-icon-element';
import { LaunchPhotoViewerIconElement } from './launch-photo-viewer-icon-element';
import { PhotoInfoUnavailableElement } from './photo-info-unavailable-element';
import { PlayLivePhotosIconElement } from './play-live-photos-icon-element';
import { RotateIconElement } from './rotate-icon-element';
import { ThumbnailElement } from './thumbnail-element';

type Requester = 'dir-tree-view' | 'leaflet-map' | 'google-maps';
type PhotoPath = string;

export class PhotoInfoViewerContent {
  private static rootElementCache = new Map<Requester, Map<PhotoPath, HTMLDivElement>>();

  public static clearCache() {
    this.rootElementCache.clear();
    this.rootElementCache.set('dir-tree-view', new Map<PhotoPath, HTMLDivElement>());
    this.rootElementCache.set('leaflet-map'  , new Map<PhotoPath, HTMLDivElement>());
    this.rootElementCache.set('google-maps'  , new Map<PhotoPath, HTMLDivElement>());
  }

  public static generateCache(photos: Photo[]) {
    const startTime = performance.now();

    photos.forEach(photo => {
      this.rootElementCache.get('dir-tree-view').set(photo.path, this.generateRootElement(photo));
      this.rootElementCache.get('leaflet-map'  ).set(photo.path, this.generateRootElement(photo));
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

  private static appendToRootElement(rootDivElement, photo: Photo) {
    const { thumbnailElement, thumbnailContainerElement } = ThumbnailElement.create(photo);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);

    [thumbnailContainerElement, nameElement, dateTakenElement]
      .forEach(element => rootDivElement.appendChild(element));

    this.appendRotateIconElement(rootDivElement, thumbnailElement, photo);
    this.appendLaunchPhotoViewerIconElement(rootDivElement, photo);
    this.appendPlayLivePhotosIconElement(rootDivElement, photo);
    this.appendMoreOptionsIconElement(rootDivElement, photo);
  }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.innerText = photo.name;
    nameElement.style.fontSize = '14px';
    nameElement.style.fontWeight = 'bold';
    return nameElement;
  }

  private static createDateTimeTakenElement(photo: Photo) {
    const dateTimeTaken = photo?.exif?.dateTimeOriginal?.displayString();
    const dateTakenElement = document.createElement('div');
    dateTakenElement.innerText = dateTimeTaken || 'Date taken is not available.';
    dateTakenElement.style.fontSize = '14px';
    dateTakenElement.style.fontWeight = 'bold';
    return dateTakenElement;
  }

  private static appendRotateIconElement(rootDivElement: HTMLDivElement, thumbnailElement: HTMLImageElement | Text, photo: Photo): void {
    if (thumbnailElement instanceof Text)
      return;

    const rotateIconElement = RotateIconElement.create(thumbnailElement, photo);
    rootDivElement.appendChild(rotateIconElement);
  }

  private static appendLaunchPhotoViewerIconElement(rootDivElement: HTMLDivElement, photo: Photo): void {
    const element = LaunchPhotoViewerIconElement.create(photo);
    rootDivElement.appendChild(element);
  }

  private static appendPlayLivePhotosIconElement(rootDivElement: HTMLDivElement, photo: Photo) {
    const element = PlayLivePhotosIconElement.create(photo);
    if (element) {
      rootDivElement.appendChild(element);
    }
  }

  private static appendMoreOptionsIconElement(rootDivElement: HTMLDivElement, photo: Photo) {
    const element = MoreOptionsIconElement.create(photo);
    if (element) {
      rootDivElement.appendChild(element);
    }
  }
}
