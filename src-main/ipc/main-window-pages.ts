import type { WebContents } from 'electron';
import { Logger } from '../../src-shared/log/logger';
import { logged, shown } from '../../src-shared/log/logged-line';

// The main window shows the app's page only, the one page that its preload's bridge serves (ipc-sender.ts). The app
// itself never navigates the window elsewhere: its routes change the URL's fragment, and links open in the OS browser
// (src-shared/url/open-url.ts). A link or a file dropped on the window would have replaced the app with another page,
// so such a navigation is prevented, as a page's new window is.

/**
 * A file's path in a file URL, decoded, so that Node.js's pathToFileURL and Chromium, which may escape a character
 * differently, give the same; on Windows without regard to case, as its file system has none.
 */
function filePathOf(url: URL): string {
  const decoded = decodeURIComponent(url.pathname);
  return process.platform === 'win32' ? decoded.toLowerCase() : decoded;
}

/** Whether `url` is the app's page `pageUrl`, a file, or `ng serve`'s origin for live reload, at any of its routes. */
export function isAppPage(url: string, pageUrl: string): boolean {
  try {
    const page = new URL(pageUrl);
    const target = new URL(url);
    return page.protocol === 'file:'
      ? target.protocol === 'file:' && filePathOf(target) === filePathOf(page)
      : target.origin === page.origin;
  } catch {
    return false;
  }
}

/** Keeps the window of `contents` on the app's page `pageUrl`. */
export function keepOnAppPage(contents: WebContents, pageUrl: string): void {
  /** Prevents a navigation or a redirect (`kind`) that would leave the app's page, and logs it. */
  const prevent = (event: Electron.Event<{ url: string }>, kind: string) => {
    if (isAppPage(event.url, pageUrl))
      return;
    event.preventDefault();
    Logger.warn(logged`[Main Window] Prevented a ${shown(kind)} away from the app's page.`);
  };
  contents.on('will-navigate', event => prevent(event, 'navigation'));
  contents.on('will-redirect', event => prevent(event, 'redirect'));
  contents.setWindowOpenHandler(() => {
    Logger.warn('[Main Window] Refused to open a window for the page.');
    return { action: 'deny' };
  });
}
