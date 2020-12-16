import { FocusMonitor } from '@angular/cdk/a11y';
import { MatMenuTrigger } from '@angular/material/menu';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { openContainingFolder, openWithAssociatedApp } from '../../../../src-shared/command/command';
import { createPrependedLogger } from '../../../../src-shared/log/create-prepended-logger';
import { FlatNode } from '../directory-tree-view.model';
import { DirTreeViewContextMenuData as ContextMenuData } from './dir-tree-view-context-menu-data';

const contextMenuLogger = createPrependedLogger('[Directory Tree View] [Context Menu]');

export class DirTreeViewContextMenuHelper {
  public static createData(node: FlatNode): ContextMenuData {
    return {
      name: node.name,
      path: node.path
    };
  }

  // Disable focus on all buttons in order to get rid of the first button being automatically focused when the context menu is opened.
  // See https://stackoverflow.com/a/51419613/7947548
  public static disableFocus(focusMonitor: FocusMonitor): void {
    const buttons = Array.from(document.getElementsByClassName('context-menu-button'));
    buttons.forEach((button: HTMLElement) => focusMonitor.stopMonitoring(button));
    if (buttons.length === 0) {
      contextMenuLogger.warn(`No buttons are found to configure disabling focus.`);
    }
  }

  // Close the context menu when the overlay receives right click.
  // See https://github.com/angular/components/issues/5007#issuecomment-362944793
  public static configureClosingWithRightClick(contextMenu: MatMenuTrigger): void {
    document.getElementsByClassName('cdk-overlay-backdrop')[0].addEventListener('contextmenu', (offEvent: MouseEvent) => {
      offEvent.preventDefault();
      contextMenu.closeMenu();
    });
  }

  public static openFile(data: ContextMenuData) {
    contextMenuLogger.info(`Open "${data.path}"`);
    Analytics.trackEvent('Directory Tree View', `Context Menu: Open File`);
    openWithAssociatedApp(data.path);
  }

  public static openContainingFolder(data: ContextMenuData) {
    contextMenuLogger.info(`Open the containing folder of "${data.path}"`);
    Analytics.trackEvent('Directory Tree View', `Context Menu: Open Folder`);
    openContainingFolder(data.path);
  }
}
