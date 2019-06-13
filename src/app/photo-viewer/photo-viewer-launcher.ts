import { Photo } from '../shared/model/photo.model';
import { Dimensions } from '../shared/model/dimensions.model';
const BrowserWindow = window.require('electron').remote.BrowserWindow;

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
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

    const dataUrl = 'data:text/html;charset=UTF-8,' + encodeURIComponent(this.createHtmlString(photo, viewerDimensions));
    browserWindow.loadURL(dataUrl);
    // browserWindow.setMenu(null);
    browserWindow.show();
  }

  private static getPhotoViewerDimensions(src: Dimensions): Dimensions {
    const reduced = this.reduceDimensionsAccordingToScreen(src);

    // BrowserWindow does not correctly handle width and height values when they are decimals like 1735.1404958677685 (not like 2000).
    // Therefore, the width and height values are floored.
    return reduced.floor();
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

  private static createHtmlString(photo: Photo, viewerDimensions: Dimensions): string {
    return `
        <!DOCTYPE html>
        <html lang="en-us">
          <head>
            <title>${photo.name}</title>
            <meta charset="UTF-8">
            <style type="text/css">
              html,
              body {
                background-color: black;
                height: 100%;
                margin: 0;
                overflow: hidden;
              }

              img {
                height: 100%;
                width: 100%;
                object-fit: contain;
                image-orientation: from-image;
              }
            </style>
          </head>
          <body>
            <img src="${photo.path}" width="${viewerDimensions.width}" height="${viewerDimensions.height}" alt="photo">
            <script>
              console.log("logged.");
            </script>
          </body>
        </html>
    `;
  }
}
