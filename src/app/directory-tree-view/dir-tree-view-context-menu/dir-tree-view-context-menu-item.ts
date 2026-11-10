import { Analytics } from '../../../../src-shared/analytics/analytics';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { openContainingFolder, openWithAssociatedApp} from '../../shared/open-with-os';
import { DirTreeViewContextMenuData as ContextMenuData } from './dir-tree-view-context-menu-data';
import { dirTreeViewContextMenuLogger as contextMenuLogger } from './dir-tree-view-context-menu-logger';

export interface DirTreeViewContextMenuItem {
  /** The key of the item's text, for the file or folder that the menu is opened on. */
  textKey: (data: ContextMenuData) => TranslationKey;
  onClick: (data: ContextMenuData) => void;
  visible: (data: ContextMenuData) => boolean;
}

export const dirTreeViewContextMenuItems: DirTreeViewContextMenuItem[] = [
  {
    // TL;DR: A text for a file and one for a folder, though English says "Select Only This" of both.
    // Details: Japanese names what is selected, "このファイルのみを選択" and "このフォルダーのみを選択": one text for
    // both said "this file" of a folder.
    textKey: (data) => data.node.type === 'directory'
      ? 'directoryTree.contextMenu.selectOnlyThisFolder'
      : 'directoryTree.contextMenu.selectOnlyThisFile',
    onClick: (data) => selectOnlyThis(data),
    visible: (data) => data.node.isSelectable,
  },
  {
    textKey: () => 'directoryTree.contextMenu.open',
    onClick: (data) => open(data),
    visible: () => true,
  },
  {
    textKey: () => 'directoryTree.contextMenu.openFolder',
    onClick: (data) => openFolder(data),
    visible: () => true,
  },
];

function open(data: ContextMenuData) {
  const path = data.node.path;
  contextMenuLogger.info(`Open "${path}"`);
  Analytics.trackEvent('Directory Tree View', `[Tree View] [Ctx Menu] Open`);
  openWithAssociatedApp(path);
}

function openFolder(data: ContextMenuData) {
  const path = data.node.path;
  contextMenuLogger.info(`Open the containing folder of "${path}"`);
  Analytics.trackEvent('Directory Tree View', `[Tree View] [Ctx Menu] Open Folder`);
  openContainingFolder(path);
}

function selectOnlyThis(data: ContextMenuData) {
  const path = data.node.path;
  contextMenuLogger.info(`Select Only This for "${path}"`);
  Analytics.trackEvent('Directory Tree View', `[Tree View] [Ctx Menu] Select Only This`);
  window.plmInternalRenderer.photoSelection.selectOnlyThis(path);
}
