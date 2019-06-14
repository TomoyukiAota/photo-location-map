import { PhotoViewerHtml } from './photo-viewer-html/photo-viewer-html';
import { Photo } from '../shared/model/photo.model';

export class PhotoViewerDataUrl {
  public static create(photo: Photo) {
    const html = PhotoViewerHtml.create(photo);
    return 'data:text/html;charset=UTF-8,' + encodeURIComponent(html);
  }
}
