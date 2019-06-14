import { Photo } from '../../shared/model/photo.model';
import { Dimensions } from '../../shared/model/dimensions.model';

export class PhotoViewerScriptTag {
  public static create(photo: Photo, viewerDimensions: Dimensions): string {
    const escapedPhotoPath = photo.path.replace(/\\/g, '\\\\');

    return `
    <script>
      console.info('This is the photo viewer for ' + '${escapedPhotoPath}');
    </script>
    `;
  }
}
