import { bridge } from '../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../src-shared/log/logger';
import { logged } from '../../../src-shared/log/logged-line';

// Opening a file or a folder with the OS, which the main process does for a path in a folder that the user opened
// (src-main/shell/). The main process logs the command; a refusal is logged here.

export function openWithAssociatedApp(path: string): void {
  bridge().shell.openWithAssociatedApp(path)
    .catch(error => Logger.error(logged`Failed to open "${path}" with its associated app.`, error));
}

export function openContainingFolder(path: string): void {
  bridge().shell.openContainingFolder(path)
    .catch(error => Logger.error(logged`Failed to open the containing folder of "${path}".`, error));
}
