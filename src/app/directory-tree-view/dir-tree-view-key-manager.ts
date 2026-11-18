import { TreeKeyManager, TreeKeyManagerFactory, TreeKeyManagerItem } from '@angular/cdk/a11y';

/**
 * Whether a key is one of Select Previous and Select Next in the Selection menu: Ctrl on Windows and Linux, or Cmd on
 * macOS, with the Left or Right arrow key (src-main/menu/selection-menu.ts).
 */
export function isSelectPreviousNextKey(event: KeyboardEvent): boolean {
  return (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && (event.ctrlKey || event.metaKey);
}

/**
 * The folder tree's keys, without those of Select Previous and Select Next.
 * TL;DR: With Ctrl or Cmd, the Left and Right arrow keys go to the Selection menu while a node of the tree has the
 * focus, as they do elsewhere. Without, they collapse and expand the node as before.
 * Details: The CDK's TreeKeyManager takes an arrow key with any modifier for the arrow alone: it collapses, expands or
 * moves the focus, and prevents the default. Electron gives an accelerator only a key that the page leaves unhandled,
 * so the menu never got these keys after a click in the tree, which focuses the row's node, a click on its checkbox
 * too. The tree has no use of its own for them.
 */
export class DirTreeViewKeyManager<T extends TreeKeyManagerItem> extends TreeKeyManager<T> {
  public override onKeydown(event: KeyboardEvent): void {
    if (isSelectPreviousNextKey(event))
      return;
    super.onKeydown(event);
  }
}

/** For the CDK's TREE_KEY_MANAGER, which the tree makes its key manager with. */
export const dirTreeViewKeyManagerFactory: TreeKeyManagerFactory<TreeKeyManagerItem> =
  (items, options) => new DirTreeViewKeyManager(items, options);
