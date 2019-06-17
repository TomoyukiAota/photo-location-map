import { Photo } from '../../shared/model/photo.model';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { Logger } from '../../../../src-shared/log/logger';

const child_process = window.require('child_process');
const os = window.require('os');

export class OpenContainingFolderIconElement {
  public static create(photo: Photo): HTMLImageElement {
    const element = document.createElement('img');
    element.src     = IconDataUrl.folder;
    element.width = 25;
    element.height = 25;
    element.title = 'Open containing folder';
    element.className = 'info-window-icon';
    element.onclick = () => this.openContainingFolder(photo);
    return element;
  }

  public static openContainingFolder(photo: Photo): void {
    const command = this.getCommandToOpenContainingFolder(photo);
    if (command) {
      this.issueCommandToOpenContainingFolder(command, photo);
    } else {
      Logger.warn(`"Open containing folder" is not supported on this platform: ${os.platform()}`);
    }
  }

  private static getCommandToOpenContainingFolder(photo: Photo): string {
    switch (os.platform()) {
      case 'win32':
        return `explorer /select,"${photo.path}"`;
      case 'darwin':
        return `open -R "${photo.path}"`;
      case 'linux':
        return `nautilus "${photo.path}"`;
      default:
        return null;
    }
  }

  private static issueCommandToOpenContainingFolder(command: string, photo: Photo): void {
    child_process.spawn(command, [], { shell: true });
    Logger.info(`Issued a command: ${command}`);
    Logger.info(`Opened the containing folder for ${photo.path}`, photo);
  }
}
