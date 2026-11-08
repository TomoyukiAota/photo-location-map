import { openWithAssociatedApp } from '../shared/open-with-os';
import { Photo } from '../shared/model/photo.model';
import { Logger } from '../../../src-shared/log/logger';

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
    Logger.info(`Launch photo viewer for ${photo.path}`);
    openWithAssociatedApp(photo.path);
  }
}
