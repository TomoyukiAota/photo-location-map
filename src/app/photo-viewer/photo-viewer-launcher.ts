import { Photo } from '../shared/model/photo.model';
const BrowserWindow = window.require('electron').remote.BrowserWindow;

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
    console.log('launched!!!!');

    const photoDisplaySize = this.reduceSizeAccordingToScreen(photo.width, photo.height);

    let browserWindow = new BrowserWindow({
      title: photo.name,
      width: photoDisplaySize.width,
      height: photoDisplaySize.height,
      useContentSize: true,
      webPreferences: {
        webSecurity: false
      }
    });

    browserWindow.on('close', function () { browserWindow = null; });

    const dataUrl = 'data:text/html;charset=UTF-8,' + encodeURIComponent(this.createHtmlString(photo, photoDisplaySize));
    browserWindow.loadURL(dataUrl);
    // browserWindow.setMenu(null);
    browserWindow.show();
  }

  private static reduceSizeAccordingToScreen(srcWidth: number, srcHeight: number) {
    const maxSrcToScreenRatio = 0.9;
    const srcToScreenWidthRatio = srcWidth / window.screen.width;
    const srcToScreenHeightRatio = srcHeight / window.screen.height;
    const srcToScreenLargerSideRatio = Math.max(srcToScreenWidthRatio, srcToScreenHeightRatio);

    if (srcToScreenLargerSideRatio <= maxSrcToScreenRatio) {
      return {
        width: srcWidth,
        height: srcHeight
      };
    }

    const reduceRatio = maxSrcToScreenRatio / srcToScreenLargerSideRatio;
    const reducedWidth  = srcWidth  * reduceRatio;
    const reducedHeight = srcHeight * reduceRatio;
    return {
      width: reducedWidth,
      height: reducedHeight
    };
  }

  private static createHtmlString(photo: Photo, photoDisplaySize: { width: number, height: number }) {
    return `
        <!DOCTYPE html>
        <html lang="en-us">
          <head>
            <title>${photo.name}</title>
            <meta charset="UTF-8">
          </head>
          <body>
            <img src="${photo.path}" width="${photoDisplaySize.width}" height="${photoDisplaySize.height}">
            <script>
              console.log("logged.");
            </script>
          </body>
        </html>
    `;
  }
}
