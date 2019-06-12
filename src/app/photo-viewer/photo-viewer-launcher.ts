import { Photo } from '../shared/model/photo.model';
const BrowserWindow = window.require('electron').remote.BrowserWindow;

export class PhotoViewerLauncher {
  public static launch(photo: Photo): void {
    console.log('launched!!!!');
    // const windowRef = window.open('', photo.name, 'width=600,height=600');

    let browserWindow = new BrowserWindow({
      title: photo.name,
      width: 600,
      height: 600,
      useContentSize: true,
      webPreferences: {
        webSecurity: false
      }
    });
    browserWindow.on('close', function () { browserWindow = null; });

    // browserWindow.setTitle(photo.name);

    const loadView = (p: Photo) => {
      return (`
        <!DOCTYPE html>
        <html lang="en-us">
          <head>
            <title>${p.name}</title>
            <meta charset="UTF-8">
          </head>
          <body>
            <img src="${p.path}" width="600" height="600">
            <script>
              console.log("logged.");
            </script>
          </body>
        </html>
      `);
    };

    const file = 'data:text/html;charset=UTF-8,' + encodeURIComponent(loadView(photo));

    browserWindow.loadURL(file);
    // browserWindow.setMenu(null);
    browserWindow.show();
  }
}
