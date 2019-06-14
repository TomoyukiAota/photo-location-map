/* tslint:disable:max-line-length */

import { Photo } from '../../shared/model/photo.model';
import { PhotoViewerStyleTag } from './photo-viewer-style-tag';
import { PhotoViewerScriptTag } from './photo-viewer-script-tag';

export class PhotoViewerHtml {
  public static create(photo: Photo): string {
    return `
<!DOCTYPE html>
<html lang="en-us">
  <head>
    <title>${photo.name}</title>
    <meta charset="UTF-8">
    <script src="https://kit.fontawesome.com/71953eb5ec.js"></script>
    ${PhotoViewerStyleTag.create()}
  </head>
  <body>
    <div class="container">
      <img src="${photo.path}"
        alt="${photo.name}"
        id="photo-image">
      <i class="fas fa-sync" id="rotate-button" onclick="rotate()" title="Rotate 90 degrees"></i>
    </div>
    ${PhotoViewerScriptTag.create(photo)}
  </body>
</html>
    `;
  }
}
