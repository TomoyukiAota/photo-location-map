import { BrowserWindow } from '@electron/remote';
import { Photo } from '../../shared/model/photo.model';

export async function launchPhotoDataViewer(photo: Photo) {
  const browserWindow = new BrowserWindow({
    title: `View Data: ${photo.name}`,
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  await browserWindow.loadURL('http://localhost:3000');
  browserWindow.show();
}
