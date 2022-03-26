import { BrowserWindow } from '@electron/remote';
import { Photo } from '../../shared/model/photo.model';

export async function launchPhotoDataViewer(photo: Photo) {
  const searchParamsObj = {
    photoPath: photo.path,
  };

  const photoDataViewerUrl = new URL('http://localhost:3000');
  photoDataViewerUrl.search = new URLSearchParams(searchParamsObj).toString();

  const browserWindow = new BrowserWindow({
    title: `View Data: ${photo.name}`,
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  await browserWindow.loadURL(photoDataViewerUrl.href);
  browserWindow.show();
}
