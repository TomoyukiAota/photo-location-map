import { protocol } from 'electron';
import { appPageScheme, photoFileScheme } from '../src-shared/main-window-schemes.js';
import { photoScheme } from './photo-data-viewer/photo-delivery.js';

// TL;DR: The schemes of the application's own, with their privileges, in the one call that Electron takes.
// Details: protocol.registerSchemesAsPrivileged can be called only once, and only before the app is ready, so
// src-main/electron-main.ts imports this before its setups that wait for the app:
// - The app's page (file-server/app-page.ts): standard, so that it has an origin and its relative addresses resolve;
//   secure, as a page of file: is; with the Fetch API; and with V8's code cache, which Electron gives only http(s)
//   and the schemes that ask for it, so that the page's scripts are not compiled again at each launch.
// - The user's photos and their thumbnails in that page (file-server/photo-files.ts): standard and secure, as the page
//   is; with CORS, so that the page may read the pixels of an image that it asks for with crossorigin, for the search
//   for faces (src/app/face-search/); and streamed, as a file is.
// - The photo of Photo Data Viewer's window (photo-data-viewer/photo-delivery.ts): secure, so that a page on https may
//   fetch it; with CORS, for the viewer's origin; and streamed, as the file is.
protocol.registerSchemesAsPrivileged([
  { scheme: appPageScheme, privileges: { standard: true, secure: true, supportFetchAPI: true, codeCache: true } },
  { scheme: photoFileScheme, privileges: { standard: true, secure: true, corsEnabled: true, stream: true } },
  { scheme: photoScheme, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);
