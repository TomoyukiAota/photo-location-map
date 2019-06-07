import { Photo } from '../../shared/model/photo.model';

export class InfoWindowContentGenerator {
  public static generate(photo: Photo) {
    const root = document.createElement('div');

    // const thumbnailElement = createThumbnailElement(photo);
    const nameElement = this.createNameElement(photo);
    // const dateTakenElement = this.createDateTakenElement(photo);

    // [thumbnailElement, nameElement, dateTakenElement]
    //   .forEach(element => root.appendChild(element));
    [nameElement]
      .forEach(element => root.appendChild(element));

    return root;
  }

  // private createThumbnailElement(photo: Photo) {
  //   if (photo.thumbnail === null) {
  //     return document.createTextNode('Thumbnail is not available.');
  //   }
  //
  //   const thumbnailElement = document.createElement('img');
  //   thumbnailElement.border  = '0';
  //   thumbnailElement.src     = photo.thumbnail.dataUrl;
  //   thumbnailElement.width   = photo.thumbnail.width;
  //   thumbnailElement.height  = photo.thumbnail.height;
  //   // thumbnailElement.onclick = event => photoViewerLauncher.launch(photo); //TODO: Implement photoViewerLauncher.
  //   return thumbnailElement;
  // }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.style.textAlign  = 'center';
    nameElement.style.fontWeight = 'bold';
    nameElement.innerText        = photo.name;
    return nameElement;
  }

  // private static createDateTakenElement(photo: Photo) {
  //   const dateTaken = photo.dateTaken || 'Date taken is not available.';
  //   const dateTakenElement = document.createElement('div');
  //   dateTakenElement.style.textAlign  = 'center';
  //   dateTakenElement.style.fontWeight = 'bold';
  //   dateTakenElement.innerText        = dateTaken;
  //   return dateTakenElement;
  // }
}
