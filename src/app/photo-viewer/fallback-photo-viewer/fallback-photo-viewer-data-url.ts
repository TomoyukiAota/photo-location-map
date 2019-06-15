import { FallbackPhotoViewerHtml } from './fallback-photo-viewer-html';
import { Photo } from '../../shared/model/photo.model';

export class FallbackPhotoViewerDataUrl {
  public static create(photo: Photo) {
    const html = FallbackPhotoViewerHtml.create(photo);
    return 'data:text/html;charset=UTF-8,' + encodeURIComponent(html);
  }
}
