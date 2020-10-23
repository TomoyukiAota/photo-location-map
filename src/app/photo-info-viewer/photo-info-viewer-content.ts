import { Photo } from '../shared/model/photo.model';
import { LaunchPhotoViewerIconElement } from './launch-photo-viewer-icon-element';
import { OpenContainingFolderIconElement } from './open-containing-folder-icon-element';
import { PlayLivePhotosIconElement } from './play-live-photos-icon-element';
import { RotateIconElement } from './rotate-icon-element';
import { ThumbnailElement } from './thumbnail-element';

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
    const { thumbnailElement, thumbnailContainerElement } = ThumbnailElement.create(photo);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);

    [thumbnailContainerElement, nameElement, dateTakenElement]
      .forEach(element => rootDivElement.appendChild(element));

    this.appendRotateIconElement(rootDivElement, thumbnailElement, photo);
    this.appendOpenContainingFolderIconElement(rootDivElement, photo);
    this.appendLaunchPhotoViewerIconElement(rootDivElement, photo);
    this.appendPlayLivePhotosIconElement(rootDivElement, photo);
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
