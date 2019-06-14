import { Photo } from '../shared/model/photo.model';
import { Dimensions } from '../shared/model/dimensions.model';
import { PhotoViewerStyleTag } from './photo-viewer-style-tag';

export class PhotoViewerHtml {
  public static create(photo: Photo, viewerDimensions: Dimensions): string {
    const escapedPhotoPath = photo.path.replace(/\\/g, '\\\\');

    return `
<!DOCTYPE html>
<html lang="en-us">
  <head>
    <title>${photo.name}</title>
    <meta charset="UTF-8">
    ${PhotoViewerStyleTag.create()}
  </head>
  <body>
    <div class="container">
      <img src="${photo.path}" width="${viewerDimensions.width}" height="${viewerDimensions.height}" alt="${photo.name}">
      <button>Rotate</button>
    </div>
    <script>
      console.info('This is the photo viewer for ' + '${escapedPhotoPath}');
    </script>
  </body>
</html>
    `;
  }
}
