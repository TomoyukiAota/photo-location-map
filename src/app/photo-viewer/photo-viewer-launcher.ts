import { Photo } from '../shared/model/photo.model';
import { Dimensions } from '../shared/model/dimensions.model';
import { Logger } from '../../../src-shared/log/logger';
import { PhotoViewerDataUrl } from './photo-viewer-data-url';
const os = window.require('os');
const child_process = window.require('child_process');
const BrowserWindow = window.require('electron').remote.BrowserWindow;

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
    if (os.platform() === 'win32') {
      child_process.spawn(`explorer "${photo.path}"`, [], { shell: true });
    } else {
      this.launchFallbackPhotoViewer(photo);
    }

    Logger.info(`Launched the photo viewer for ${photo.path}`, photo);
  }

  private static launchFallbackPhotoViewer(photo: Photo): void {
    const viewerDimensions = this.getPhotoViewerDimensions(photo.dimensions);

    let browserWindow = new BrowserWindow({
      title: photo.name,
      width: viewerDimensions.width,
      height: viewerDimensions.height,
      useContentSize: true,
      webPreferences: {
        webSecurity: false
      }
    });

    browserWindow.on('close', function () { browserWindow = null; });

    const dataUrl = PhotoViewerDataUrl.create(photo);
    browserWindow.loadURL(dataUrl);
    // browserWindow.setMenu(null);
    browserWindow.show();
  }

  private static getPhotoViewerDimensions(src: Dimensions): Dimensions {
    const reduced = this.reduceDimensionsAccordingToScreen(src);

    // BrowserWindow does not correctly handle width and height values when they are decimals like 1735.1404958677685 (not like 2000).
    // Therefore, the width and height values are floored.
    const floored = reduced.floor();

    // For the rotated photo to be displayed well, the photo viewer needs to be square.
    return floored.cropToSquare();
  }

  private static reduceDimensionsAccordingToScreen(src: Dimensions): Dimensions {
    const maxSrcToScreenRatio = 0.9;
    const srcToScreenWidthRatio = src.width / window.screen.width;
    const srcToScreenHeightRatio = src.height / window.screen.height;
    const srcToScreenLargerSideRatio = Math.max(srcToScreenWidthRatio, srcToScreenHeightRatio);

    if (srcToScreenLargerSideRatio <= maxSrcToScreenRatio) {
      return src;
    }

    const reduceRatio = maxSrcToScreenRatio / srcToScreenLargerSideRatio;
    const reducedWidth  = src.width  * reduceRatio;
    const reducedHeight = src.height * reduceRatio;
    return new Dimensions(reducedWidth, reducedHeight);
  }
}
