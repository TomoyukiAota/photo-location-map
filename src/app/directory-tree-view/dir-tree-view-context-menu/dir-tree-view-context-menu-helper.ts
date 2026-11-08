import { FocusMonitor } from '@angular/cdk/a11y';
import { MatMenuTrigger } from '@angular/material/menu';
import { first } from 'rxjs';
import { FlatNode } from '../directory-tree-view.model';
import { DirTreeViewContextMenuData as ContextMenuData } from './dir-tree-view-context-menu-data';
import { dirTreeViewContextMenuLogger as contextMenuLogger } from './dir-tree-view-context-menu-logger';


export class DirTreeViewContextMenuHelper {
  public static configureStyleForContextMenuTarget(event: MouseEvent, contextMenu: MatMenuTrigger) {
    const contextMenuTargetCssClass = 'context-menu-target';
    const contextMenuTarget = event.currentTarget as HTMLElement;
    contextMenuTarget?.classList.add(contextMenuTargetCssClass);
    contextMenu.menuClosed.pipe(first()).subscribe(() => {
      contextMenuTarget?.classList.remove(contextMenuTargetCssClass);
    });
  }

  public static createData(node: FlatNode): ContextMenuData {
    return {
      node,
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

  // Close the context menu when its backdrop receives right click.
  // See https://github.com/angular/components/issues/5007#issuecomment-362944793
  // The menu's backdrop is the last one in the document. openMenu() has just attached the menu's overlay, whose host
  // the CDK puts at the end of the overlay container, with the backdrop inside it (a popover, where the browser supports
  // popovers) or just before it. An earlier backdrop can still be there: right after a folder has loaded, the loading
  // dialog's fades out for a moment. Listening to the first one, the menu then stayed open on a right click outside.
  public static configureClosingWithRightClick(contextMenu: MatMenuTrigger): void {
    const backdrops = document.getElementsByClassName('cdk-overlay-backdrop');
    const menuBackdrop = backdrops[backdrops.length - 1];
    if (!menuBackdrop) {
      contextMenuLogger.warn(`No backdrop is found to configure closing with right click.`);
      return;
    }
    menuBackdrop.addEventListener('contextmenu', (offEvent: MouseEvent) => {
      offEvent.preventDefault();
      contextMenu.closeMenu();
    });
  }
}
