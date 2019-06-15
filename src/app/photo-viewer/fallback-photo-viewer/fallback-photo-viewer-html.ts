import { Photo } from '../../shared/model/photo.model';
import { FallbackPhotoViewerStyleTag } from './fallback-photo-viewer-style-tag';
import { FallbackPhotoViewerScriptTag } from './fallback-photo-viewer-script-tag';

export class FallbackPhotoViewerHtml {
  public static create(photo: Photo): string {
    return `
<!DOCTYPE html>
<html lang="en-us">
  <head>
    <title>${photo.name}</title>
    <meta charset="UTF-8">
    <script src="https://kit.fontawesome.com/71953eb5ec.js"></script>
    ${FallbackPhotoViewerStyleTag.create()}
  </head>
  <body>
    <div class="container">
      <img src="file://${photo.path}" alt="${photo.name}" id="photo-image">
      <i class="fas fa-sync" id="rotate-button" onclick="rotate()" title="Rotate 90 degrees"></i>
    </div>
    ${FallbackPhotoViewerScriptTag.create(photo)}
  </body>
</html>
    `;
  }
}
