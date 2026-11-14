import { photoDataViewerServerOverride } from '../../electron-util/e2e-test-hooks.js';

/** The URL to load Photo Data Viewer from: its production server, or the local build that a test serves. */
export function getPhotoDataViewerServerUrl(): string {
  // A test can serve Photo Data Viewer from a local build (electron-util/e2e-test-hooks.js); ordinary launches cannot.
  if (photoDataViewerServerOverride)
    return photoDataViewerServerOverride;

  // Production Server URL
  const serverUrl = 'https://pdv-in-plm.vercel.app/';

  // Preview Server URL
  // const serverUrl = 'https://pdv-in-plm-git-plm-tomoyukiaota.vercel.app/';

  // Development Server URL
  // const serverUrl = 'http://localhost:3100';

  return serverUrl;
}
