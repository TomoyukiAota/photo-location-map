// What Photo Data Viewer's page gets from its window's preload (electron-util/preload/photo-data-viewer.cjs), as
// window.plmPhotoDataViewer, since its window is isolated: no Node.js, a sandbox and context isolation. The viewer is
// deployed apart from this app (https://github.com/TomoyukiAota/photo-data-viewer), which keeps a copy of this.

/**
 * The photo of the window, which the main process gives only to the page it loaded, for the photo that the user chose
 * in View Data. `type` is the MIME type of the file's extension, '' for an unknown one, as `mime-types` gave it.
 */
export type PhotoDataViewerPhoto =
  { name: string; type: string } & (
    /** A URL to fetch the photo from: only this window's page may, from the viewer's origin, until the window closes. */
    | { url: string }
    /** The photo's bytes. */
    | { bytes: Uint8Array });

export interface PhotoDataViewerBridge {
  /** 1 since stage C2 of the remote removal. A viewer that does not know a version uses none of it. */
  readonly version: 1;
  readPhoto(): Promise<PhotoDataViewerPhoto>;
  /** Records an event in this app's analytics, as the viewer's legacy channel did (analytics-backend-track-event). */
  trackEvent(category: string, action: string, label?: string, value?: string): void;
}
