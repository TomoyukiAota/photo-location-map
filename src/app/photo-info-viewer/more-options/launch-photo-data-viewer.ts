import { BrowserWindow } from '@electron/remote';
import { Photo } from '../../shared/model/photo.model';

// Production Server URL
// const urlStr = 'https://photo-data-viewer-plm.vercel.app/';

// Production Preview Server URL
// const urlStr = 'https://photo-data-viewer-git-feature-photo-locatio-d5bc15-tomoyukiaota.vercel.app/';

// Development Server URL
const urlStr = 'http://localhost:3000';

export async function launchPhotoDataViewer(photo: Photo) {
  const searchParamsObj = {
    photoPath: photo.path,
  };

  const photoDataViewerUrl = new URL(urlStr);
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
