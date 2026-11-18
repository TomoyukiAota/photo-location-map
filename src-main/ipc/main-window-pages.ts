import type { WebContents } from 'electron';
import { Logger } from '../../src-shared/log/logger.js';
import { logged, shown } from '../../src-shared/log/logged-line.js';

// The main window shows the app's page only, the one page that its preload's bridge serves (ipc-sender.ts). The app
// itself never navigates the window elsewhere: its routes change the URL's fragment, and links open in the OS browser
// (src-shared/url/open-url.ts). The page takes a drop of files and folders itself, to open them
// (src/app/drop-to-open/). A link dropped on the window, or a file that the page does not take, would have replaced
// the app with another page, so such a navigation is prevented, as a page's new window is.

/**
 * Whether `url` is on the app's page `pageUrl`, at any of its routes: of the app's scheme (src-main/file-server/), or of
 * `ng serve`'s origin for live reload.
 * TL;DR: The scheme and the host are compared, not the origins.
 * Details: Node.js's URL knows only the schemes of the web, so the origin of the app's scheme is "null", as that of any
 * other scheme that it does not know, such as one that another application registered. For http, the scheme and the
 * host, with its port, are the origin.
 */
export function isAppPage(url: string, pageUrl: string): boolean {
  try {
    const page = new URL(pageUrl);
    const target = new URL(url);
    return target.protocol === page.protocol && target.host === page.host;
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
