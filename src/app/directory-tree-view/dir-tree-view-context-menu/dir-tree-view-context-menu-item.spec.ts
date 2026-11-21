import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { tIn } from '../../../../src-shared/i18n/i18n';
import { LanguageCode } from '../../../../src-shared/i18n/languages';
import { Photo } from '../../shared/model/photo.model';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { PhotoRevealService } from '../../shared/service/photo-reveal.service';
import { NestedNode } from '../directory-tree-view.model';
import { dirTreeViewContextMenuItems } from './dir-tree-view-context-menu-item';

describe('dirTreeViewContextMenuItems', () => {
  /** The texts of the menu opened on a file or a folder, in `language`. */
  function texts(type: NestedNode['type'], language: LanguageCode, isSelectable = true): string[] {
    const data = { node: { type, isSelectable } as NestedNode };
    return dirTreeViewContextMenuItems.filter(item => item.visible(data)).map(item => tIn(language, item.textKey(data)));
  }

  it('names a file and a folder in the item that selects only it, in a language that names them', () => {
    expect(texts('file', 'ja')).toEqual(['このファイルのみを選択', 'マップで表示', '開く', 'フォルダーを開く']);
    expect(texts('directory', 'ja')).toEqual(['このフォルダーのみを選択', '開く', 'フォルダーを開く']);
  });

  it('says the same of a file and a folder in English, and shows a photo with a location on the map', () => {
    expect(texts('file', 'en')).toEqual(['Select Only This', 'Reveal in Map', 'Open', 'Open Folder']);
    expect(texts('directory', 'en')).toEqual(['Select Only This', 'Open', 'Open Folder']);
  });

  it('leaves the items that need a location out for a file or folder that cannot be selected', () => {
    expect(texts('file', 'en', false)).toEqual(['Open', 'Open Folder']);
    expect(texts('directory', 'en', false)).toEqual(['Open', 'Open Folder']);
  });

  it('asks the map to reveal the photo of the file', () => {
    const photo = Object.assign(new Photo(), { name: 'IMG_0001.JPG', path: '/photos/IMG_0001.JPG' });
    vi.spyOn(TestBed.inject(PhotoDataService), 'getPhoto').mockImplementation(path => path === photo.path ? photo : null);
    const revealInMap = vi.spyOn(TestBed.inject(PhotoRevealService), 'revealInMap').mockImplementation(() => undefined);
    const data = { node: { type: 'file', isSelectable: true, path: photo.path } as NestedNode };

    const item = dirTreeViewContextMenuItems.find(each => each.textKey(data) === 'directoryTree.contextMenu.revealInMap');
    item.onClick(data, TestBed.inject(Injector));

    expect(revealInMap).toHaveBeenCalledExactlyOnceWith(photo);
  });

  it('has Scroll to Here first in the menu of a row kept at the top of the tree, and nowhere else', () => {
    const scrollToHere = vi.fn();
    const data = { node: { type: 'directory', isSelectable: true } as NestedNode, scrollToHere };
    const shown = (language: LanguageCode) => dirTreeViewContextMenuItems.filter(item => item.visible(data))
      .map(item => tIn(language, item.textKey(data)));
    expect(shown('en')).toEqual(['Scroll to Here', 'Select Only This', 'Open', 'Open Folder']);
    expect(shown('ja')).toEqual(['このフォルダーまでスクロール', 'このフォルダーのみを選択', '開く', 'フォルダーを開く']);
    expect(texts('directory', 'en')).not.toContain('Scroll to Here');

    const item = dirTreeViewContextMenuItems.find(each => each.textKey(data) === 'directoryTree.contextMenu.scrollToHere');
    item.onClick(data, TestBed.inject(Injector));
    expect(scrollToHere).toHaveBeenCalledTimes(1);
  });
});
