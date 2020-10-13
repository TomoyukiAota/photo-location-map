import { Photo } from '../../shared/model/photo.model';
import { Dimensions } from '../../shared/model/dimensions.model';
import { FallbackPhotoViewerDataUrl } from './fallback-photo-viewer-data-url';
import { fallbackPhotoViewerMenu } from './fallback-photo-viewer-menu';

const BrowserWindow = window.require('electron').remote.BrowserWindow;

export class FallbackPhotoViewer {
  public static launch(photo: Photo): void {
    const viewerDimensions = this.getPhotoViewerDimensions(photo.exif.imageDimensions);

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

    const dataUrl = FallbackPhotoViewerDataUrl.create(photo);
    browserWindow.loadURL(dataUrl);
    browserWindow.setMenu(fallbackPhotoViewerMenu);
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
