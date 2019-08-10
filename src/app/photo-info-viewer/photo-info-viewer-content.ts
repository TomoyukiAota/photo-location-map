import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from '../shared/model/photo.model';
import { PhotoViewerLauncher } from '../photo-viewer/photo-viewer-launcher';
import { OpenContainingFolderIconElement } from './open-containing-folder-icon-element';
import { RotateIconElement } from './rotate-icon-element';
import { LaunchPhotoViewerIconElement } from './launch-photo-viewer-icon-element';
import { PlayLivePhotosIconElement } from './play-live-photos-icon-element';

export class PhotoInfoViewerContent {
  public static generate(photo: Photo) {
    const rootDivElement = document.createElement('div');
    rootDivElement.style.textAlign = 'center';

    if (photo) {
      this.appendToRootDivElement(rootDivElement, photo);
    } else {
      rootDivElement.innerText = 'Photo information is unavailable.';
    }

    return rootDivElement;
  }

  private static appendToRootDivElement(rootDivElement, photo: Photo) {
    const thumbnailElement = this.createThumbnailElement(photo);
    const thumbnailContainerElement = this.createThumbnailContainerElement(photo, thumbnailElement);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);

    [thumbnailContainerElement, nameElement, dateTakenElement]
      .forEach(element => rootDivElement.appendChild(element));

    this.appendRotateIconElement(rootDivElement, thumbnailElement, photo);
    this.appendOpenContainingFolderIconElement(rootDivElement, photo);
    this.appendLaunchPhotoViewerIconElement(rootDivElement, photo);
    this.appendPlayLivePhotosIconElement(rootDivElement, photo);
  }

  private static createThumbnailElement(photo: Photo) {
    if (!photo.thumbnail) {
      return document.createTextNode('Thumbnail is not available.');
    }

    const thumbnailElement = document.createElement('img');
    thumbnailElement.src = photo.thumbnail.dataUrl;
    thumbnailElement.width = photo.thumbnail.dimensions.width;
    thumbnailElement.height = photo.thumbnail.dimensions.height;
    thumbnailElement.title = `Click the thumbnail to open ${photo.name}`;
    thumbnailElement.style.transition = 'transform 0.3s ease-in-out';
    thumbnailElement.onclick = () => this.handleThumbnailClick(photo);
    return thumbnailElement;
  }

  private static handleThumbnailClick(photo: Photo): void {
    Logger.info(`Photo Info Viewer: Clicked the thumbnail of ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Thumbnail');
    PhotoViewerLauncher.launch(photo);
  }

  private static createThumbnailContainerElement(photo: Photo, thumbnailElement: HTMLImageElement | Text) {
    const thumbnailContainer = document.createElement('div');

    if (photo.thumbnail) {
      thumbnailContainer.style.display = 'flex';
      thumbnailContainer.style.justifyContent = 'center';
      thumbnailContainer.style.alignItems = 'center';
      const thumbnailContainerDimensions = photo.thumbnail.dimensions.expandToSquare();
      thumbnailContainer.style.width = thumbnailContainerDimensions.width.toString() + 'px';
      thumbnailContainer.style.minWidth = '200px';
      thumbnailContainer.style.height = thumbnailContainerDimensions.height.toString() + 'px';
    }

    thumbnailContainer.appendChild(thumbnailElement);
    return thumbnailContainer;
  }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.innerText = photo.name;
    nameElement.style.fontSize = '14px';
    nameElement.style.fontWeight = 'bold';
    return nameElement;
  }

  private static createDateTimeTakenElement(photo: Photo) {
    const dateTaken = photo.dateTimeTaken || 'Date taken is not available.';
    const dateTakenElement = document.createElement('div');
    dateTakenElement.innerText = dateTaken;
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

  private static appendOpenContainingFolderIconElement(rootDivElement: HTMLDivElement, photo: Photo): void {
    const element = OpenContainingFolderIconElement.create(photo);
    rootDivElement.appendChild(element);
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
}
