import { app, protocol } from 'electron';
import { photoFileScheme } from '../../src-shared/main-window-schemes.js';
import { mainWindowPageOrigin, respondToPhotoFileRequest, showablePath } from './photo-files.js';

// The photos and thumbnails of the main window's page (photo-files.ts), whose scheme src-main/privileged-schemes-setup.ts
// registers with its privileges. Answered once the app is ready, before the user can open a folder; also for the page
// of ng serve in live reload, which is not served from plm-app:, and whose origin the answers then allow to read them.
app.whenReady().then(() => protocol.handle(photoFileScheme,
  request => respondToPhotoFileRequest(request, showablePath, mainWindowPageOrigin())));
