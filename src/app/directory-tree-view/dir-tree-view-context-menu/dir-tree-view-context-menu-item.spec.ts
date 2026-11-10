import { tIn } from '../../../../src-shared/i18n/i18n';
import { LanguageCode } from '../../../../src-shared/i18n/languages';
import { NestedNode } from '../directory-tree-view.model';
import { dirTreeViewContextMenuItems } from './dir-tree-view-context-menu-item';

describe('dirTreeViewContextMenuItems', () => {
  /** The texts of the menu opened on a file or a folder, in `language`. */
  function texts(type: NestedNode['type'], language: LanguageCode, isSelectable = true): string[] {
    const data = { node: { type, isSelectable } as NestedNode };
    return dirTreeViewContextMenuItems.filter(item => item.visible(data)).map(item => tIn(language, item.textKey(data)));
  }

  it('names a file and a folder in the item that selects only it, in a language that names them', () => {
    expect(texts('file', 'ja')).toEqual(['このファイルのみを選択', '開く', 'フォルダーを開く']);
    expect(texts('directory', 'ja')).toEqual(['このフォルダーのみを選択', '開く', 'フォルダーを開く']);
  });

  it('says the same of a file and a folder in English', () => {
    expect(texts('file', 'en')).toEqual(['Select Only This', 'Open', 'Open Folder']);
    expect(texts('directory', 'en')).toEqual(['Select Only This', 'Open', 'Open Folder']);
  });

  it('leaves that item out for a file or folder that cannot be selected', () => {
    expect(texts('file', 'en', false)).toEqual(['Open', 'Open Folder']);
    expect(texts('directory', 'en', false)).toEqual(['Open', 'Open Folder']);
  });
});
