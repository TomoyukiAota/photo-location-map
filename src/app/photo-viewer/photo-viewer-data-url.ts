import { PhotoViewerHtml } from './photo-viewer-html/photo-viewer-html';
import { Photo } from '../shared/model/photo.model';
import { Dimensions } from '../shared/model/dimensions.model';

export class PhotoViewerDataUrl {
  public static create(photo: Photo, viewerDimensions: Dimensions) {
    const html = PhotoViewerHtml.create(photo, viewerDimensions);
    return 'data:text/html;charset=UTF-8,' + encodeURIComponent(html);
  }
}
