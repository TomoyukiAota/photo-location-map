import { Photo } from '../../shared/model/photo.model';
import { PhotoViewerLauncher } from '../../photo-viewer/photo-viewer-launcher';
import { IconDataUrl } from '../../../assets/icon-data-url';

export class InfoWindowContentGenerator {
  public static generate(photo: Photo) {
    const rootDivElement = document.createElement('div');
    rootDivElement.style.textAlign = 'center';

    const thumbnailElement = this.createThumbnailElement(photo);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);
    const rotateIconElement = this.createRotateIconElement();

    [thumbnailElement, nameElement, dateTakenElement, rotateIconElement]
      .forEach(element => rootDivElement.appendChild(element));

    return rootDivElement;
  }

  private static createThumbnailElement(photo: Photo) {
    if (photo.thumbnail === null) {
      return document.createTextNode('Thumbnail is not available.');
    }

    const thumbnailElement = document.createElement('img');
    thumbnailElement.src     = photo.thumbnail.dataUrl;
    thumbnailElement.width   = photo.thumbnail.width;
    thumbnailElement.height  = photo.thumbnail.height;
    thumbnailElement.onclick = () => PhotoViewerLauncher.launch(photo);
    return thumbnailElement;
  }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.style.textAlign  = 'center';
    nameElement.style.fontWeight = 'bold';
    nameElement.innerText        = photo.name;
    return nameElement;
  }

  private static createDateTimeTakenElement(photo: Photo) {
    const dateTaken = photo.dateTimeTaken || 'Date taken is not available.';
    const dateTakenElement = document.createElement('div');
    dateTakenElement.style.textAlign  = 'center';
    dateTakenElement.style.fontWeight = 'bold';
    dateTakenElement.innerText        = dateTaken;
    return dateTakenElement;
  }

  private static createRotateIconElement(): HTMLImageElement {
    const rotateIconElement = document.createElement('img');
    rotateIconElement.src     = IconDataUrl.rotate;
    rotateIconElement.width = 30;
    rotateIconElement.height = 30;
    rotateIconElement.title = 'Rotate the thumbnail 90 degrees';
    rotateIconElement.style.padding = '4px';
    rotateIconElement.style.marginTop = '6px';
    rotateIconElement.style.backgroundColor = '#bbbbbb';
    rotateIconElement.style.borderRadius = '5px';
    return rotateIconElement;
  }
}
