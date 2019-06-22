import { Command } from '../../../src-shared/command/command';
import { Logger } from '../../../src-shared/log/logger';
import { Photo } from '../shared/model/photo.model';
import { FallbackPhotoViewer } from './fallback-photo-viewer/fallback-photo-viewer';

const child_process = window.require('child_process');
const os = window.require('os');

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
    const command = Command.toRunAssociatedApp(photo.path);
    if (command) {
      this.launchAssociatedApp(command, photo);
    } else {
      this.launchFallbackPhotoViewer(photo);
    }
  }

  private static launchAssociatedApp(command: string, photo: Photo): void {
    child_process.spawn(command, [], { shell: true });
    Logger.info(`Issued a command: ${command}`);
    Logger.info(`Opened ${photo.path}`, photo);
  }

  private static launchFallbackPhotoViewer(photo: Photo): void {
    FallbackPhotoViewer.launch(photo);
    Logger.info(`Launched the fallback photo viewer for ${photo.path}`, photo);
  }
}
