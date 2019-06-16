import { Photo } from '../../shared/model/photo.model';
import { PhotoViewerLauncher } from '../../photo-viewer/photo-viewer-launcher';
import { IconDataUrl } from '../../../assets/icon-data-url';

export class InfoWindowContentGenerator {
  public static generate(photo: Photo) {
    const rootDivElement = document.createElement('div');
    rootDivElement.style.textAlign = 'center';

    const thumbnailElement = this.createThumbnailElement(photo);
    const thumbnailContainerElement = this.createThumbnailContainerElement(photo, thumbnailElement);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);

    [thumbnailContainerElement, nameElement, dateTakenElement]
      .forEach(element => rootDivElement.appendChild(element));

    this.appendRotateIcon(rootDivElement, thumbnailElement);

    return rootDivElement;
  }

  private static createThumbnailContainerElement(photo: Photo, thumbnailElement: HTMLImageElement | Text) {
    const thumbnailContainer = document.createElement('div');

    if (photo.thumbnail) {
      thumbnailContainer.style.display = 'flex';
      thumbnailContainer.style.justifyContent = 'center';
      thumbnailContainer.style.alignItems = 'center';
      const thumbnailContainerDimensions = photo.thumbnail.dimensions.expandToSquare();
      thumbnailContainer.style.width = thumbnailContainerDimensions.width.toString() + 'px';
      thumbnailContainer.style.height = thumbnailContainerDimensions.height.toString() + 'px';
    }

    thumbnailContainer.appendChild(thumbnailElement);
    return thumbnailContainer;
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
    thumbnailElement.onclick = () => PhotoViewerLauncher.launch(photo);
    return thumbnailElement;
  }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.style.fontWeight = 'bold';
    nameElement.innerText        = photo.name;
    return nameElement;
  }

  private static createDateTimeTakenElement(photo: Photo) {
    const dateTaken = photo.dateTimeTaken || 'Date taken is not available.';
    const dateTakenElement = document.createElement('div');
    dateTakenElement.style.fontWeight = 'bold';
    dateTakenElement.innerText        = dateTaken;
    return dateTakenElement;
  }

  private static createRotateIconElement(thumbnailElement: HTMLImageElement): HTMLImageElement {
    const rotateIconElement = document.createElement('img');
    rotateIconElement.src     = IconDataUrl.rotate;
    rotateIconElement.width = 30;
    rotateIconElement.height = 30;
    rotateIconElement.title = 'Rotate the thumbnail 90 degrees';
    rotateIconElement.className = 'info-window-rotate-icon';
    rotateIconElement.onclick = () => this.rotateThumbnail(thumbnailElement);
    return rotateIconElement;
  }

  private static rotateThumbnail(thumbnailElement: HTMLImageElement): void {
    const transformString = thumbnailElement.style.transform;
    if (transformString.includes('rotate(')) {
      const currentDegreeInString = transformString.split('rotate(')[1].split('deg)')[0];
      const currentDegree = Number(currentDegreeInString);
      const nextDegree = currentDegree + 90;
      thumbnailElement.style.transform = `rotate(${nextDegree}deg)`;
    } else {
      thumbnailElement.style.transform = 'rotate(90deg)';
    }
  }

  private static appendRotateIcon(rootDivElement: HTMLDivElement, thumbnailElement: HTMLImageElement | Text): void {
    if (thumbnailElement instanceof Text)
      return;

    const rotateIconElement = this.createRotateIconElement(thumbnailElement);
    rootDivElement.appendChild(rotateIconElement);
  }
}
