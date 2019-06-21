import { IconDataUrl } from '../../../assets/icon-data-url';
import { Photo } from '../../shared/model/photo.model';
import { Logger } from '../../../../src-shared/log/logger';

const child_process = window.require('child_process');
const fs = window.require('fs');
const os = window.require('os');
const path = window.require('path');

export class PlayLivePhotosIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const parsedPath = path.parse(photo.path);
    const livePhotosFilePath = path.join(parsedPath.dir, parsedPath.name + '.MOV');
    if (!fs.existsSync(livePhotosFilePath))
      return null;

    const element = document.createElement('img');
    element.src     = IconDataUrl.play;
    element.width = 25;
    element.height = 25;
    element.title = 'Live Photos';
    element.className = 'info-window-icon';
    element.onclick = () => this.playLivePhotos(livePhotosFilePath, photo);
    return element;
  }

  public static playLivePhotos(livePhotosFilePath: string, photo: Photo): void {
    const command = this.getCommandToPlayLivePhotos(livePhotosFilePath);
    if (command) {
      this.issueCommandToPlayLivePhotos(command, livePhotosFilePath, photo);
    } else {
      Logger.warn(`"Live Photos" is not supported on this platform: ${os.platform()}`);
    }
  }

  private static getCommandToPlayLivePhotos(livePhotosFilePath: string): string {
    switch (os.platform()) {
      case 'win32':
        return `explorer "${livePhotosFilePath}"`;
      case 'darwin':
        return `open "${livePhotosFilePath}"`;
      case 'linux':
        return `xdg-open "${livePhotosFilePath}"`;
      default:
        return null;
    }
  }

  private static issueCommandToPlayLivePhotos(command: string, livePhotosFilePath: string, photo: Photo): void {
    child_process.spawn(command, [], { shell: true });
    Logger.info(`Issued a command: ${command}`);
    Logger.info(`Played Live Photos by opening ${livePhotosFilePath}`, photo);
  }
}
