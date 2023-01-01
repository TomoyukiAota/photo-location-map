import { Analytics } from '../../../../src-shared/analytics/analytics';
import { openContainingFolder, openWithAssociatedApp} from '../../../../src-shared/command/command';
import { DirTreeViewContextMenuData as ContextMenuData } from './dir-tree-view-context-menu-data';
import { dirTreeViewContextMenuLogger as contextMenuLogger } from './dir-tree-view-context-menu-logger';

export interface DirTreeViewContextMenuItem {
  text: string;
  onClick: (data: ContextMenuData) => void;
  visible: (data: ContextMenuData) => boolean;
}

export const dirTreeViewContextMenuItems: DirTreeViewContextMenuItem[] = [
  {
    text: 'Open',
    onClick: (data) => open(data),
    visible: () => true,
  },
  {
    text: 'Open Folder',
    onClick: (data) => openFolder(data),
    visible: () => true,
  },
  {
    text: 'Select Only This',
    onClick: (data) => selectOnlyThis(data),
    visible: (data) => data.node.isSelectable,
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
