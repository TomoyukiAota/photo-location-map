import { Photo } from '../../shared/model/photo.model';
import { PhotoViewerLauncher } from '../../photo-viewer/photo-viewer-launcher';

export class InfoWindowContentGenerator {
  public static generate(photo: Photo) {
    const root = document.createElement('div');

    const thumbnailElement = this.createThumbnailElement(photo);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);

    [thumbnailElement, nameElement, dateTakenElement]
      .forEach(element => root.appendChild(element));

    return root;
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
}
