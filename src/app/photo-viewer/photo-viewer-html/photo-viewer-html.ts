import { Photo } from '../../shared/model/photo.model';
import { Dimensions } from '../../shared/model/dimensions.model';
import { PhotoViewerStyleTag } from './photo-viewer-style-tag';
import { PhotoViewerScriptTag } from './photo-viewer-script-tag';

export class PhotoViewerHtml {
  public static create(photo: Photo, viewerDimensions: Dimensions): string {
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
      <img src="${photo.path}"
        width="${viewerDimensions.width}"
        height="${viewerDimensions.height}"
        alt="${photo.name}"
        id="photo-image">
      <button onclick="rotate()">Rotate</button>
    </div>
    ${PhotoViewerScriptTag.create(photo, viewerDimensions)}
  </body>
</html>
    `;
  }
}
