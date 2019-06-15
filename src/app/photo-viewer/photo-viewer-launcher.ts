import { Photo } from '../shared/model/photo.model';
import { Logger } from '../../../src-shared/log/logger';
import { FallbackPhotoViewer } from './fallback-photo-viewer/fallback-photo-viewer';

const child_process = window.require('child_process');
const os = window.require('os');

const commandExistsSync = window.require('command-exists').sync;

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
    if (os.platform() === 'win32') {
      this.launchAssociatedAppOnWindows(photo);
    } else if (commandExistsSync('open')) {
      // On non-Windows platform, if "open" command is available, use it to launch the associated application.
      // At least on macOS and Ubuntu, "open" command is available.
      this.launchAssociatedAppOnNonWindows(photo);
    } else {
      // On non-Windows platform, if "open" command is not available, launch the fallback photo viewer.
      this.launchFallbackPhotoViewer(photo);
    }
  }

  private static launchAssociatedAppOnWindows(photo: Photo): void {
    child_process.spawn(`explorer "${photo.path}"`, [], { shell: true });
    Logger.info(`Launched the associated application for ${photo.path}`, photo);
  }

  private static launchAssociatedAppOnNonWindows(photo: Photo): void {
    child_process.spawn(`open "${photo.path}"`, [], {shell: true});
    Logger.info(`Launched the associated application for ${photo.path}`, photo);
  }

  private static launchFallbackPhotoViewer(photo: Photo): void {
    FallbackPhotoViewer.launch(photo);
    Logger.info(`Launched the fallback photo viewer for ${photo.path}`, photo);
  }
}
