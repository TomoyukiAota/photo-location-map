import { app, ipcMain, protocol } from 'electron';
import { IpcConstants } from '../../src-shared/ipc/ipc-constants.js';
import { isFromPhotoDataViewerWindow } from '../ipc/ipc-sender.js';
import { photoFor, photoScheme, respondToPhotoRequest } from './photo-delivery.js';

// The photo of Photo Data Viewer's window (photo-delivery.ts). Imported before the app is ready, as registering a
// scheme requires (src-main/electron-main.ts). Secure, so that a page on https may fetch it; with CORS, for the
// viewer's origin; and streamed, as the file is.
protocol.registerSchemesAsPrivileged([
  { scheme: photoScheme, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// The window's top frame, which stays on the viewer's origin (photo-delivery.ts, keepOnViewerPages), as the main
// window's stays on the app's page (src-main/ipc/ipc-sender.ts).
ipcMain.handle(IpcConstants.PhotoDataViewer.Photo, event => {
  if (!isFromPhotoDataViewerWindow(event))
    throw new Error('Only the page of Photo Data Viewer in its window has a photo.');
  return photoFor(event.sender);
});

app.whenReady().then(() => protocol.handle(photoScheme, respondToPhotoRequest));
