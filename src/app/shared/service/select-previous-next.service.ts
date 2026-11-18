import { computed, effect, inject, Service } from '@angular/core';
import { bridge } from '../../../../src-shared/bridge/plm-bridge';
import { IpcParams } from '../../../../src-shared/ipc/ipc-params';
import { Logger } from '../../../../src-shared/log/logger';
import {
  compareByShootingTime,
  compareNames,
  shootingTimeOf,
} from '../../directory-tree-view/dir-tree-view-sort/dir-tree-view-sort-comparison';
import { DirectoryTreeViewDataService } from '../../directory-tree-view/directory-tree-view-data.service';
import { DirectoryTreeViewSelectionService } from '../../directory-tree-view/directory-tree-view-selection.service';
import { NestedNode } from '../../directory-tree-view/directory-tree-view.model';
import { PhotoDataService } from './photo-data.service';
import { SelectedPhotoService } from './selected-photo.service';

/** The photos that Select Previous and Select Next go through, by their paths, in the order that they were taken. */
interface ShootingOrder {
  readonly paths: readonly string[];
  /** Where each path is in `paths`. */
  readonly indexes: ReadonlyMap<string, number>;
}

type MenuState = IpcParams.PhotoSelection.UpdateSelectPreviousNextMenus;

/** The files that can be selected in the tree, those of photos with location data, in the folders all the way down. */
function selectableFiles(nodes: readonly NestedNode[]): NestedNode[] {
  return nodes.flatMap(node => node.type === 'file'
    ? (node.isSelectable ? [node] : [])
    : selectableFiles(node.children));
}

/** The order of two paths of the same name and time: by their letters, whatever their case, then by their case. */
function comparePaths(a: string, b: string): number {
  return compareNames(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

/**
 * Select Previous and Select Next: they select only the photo taken just before or just after a photo, as Select
 * Only This does for the photo itself, in a photo's menu (MoreOptionsMenuComponent) and, for the one selected photo,
 * in the Selection menu (src-main/menu/selection-menu.ts).
 * TL;DR: The photos are those that can be selected, which have location data, in the folder tree's order "By Date
 * Taken", ascending, over the whole opened folder rather than within each of its folders: a trip from its beginning to
 * its end, whatever subfolders its photos are in. There is no photo before the first or after the last.
 * Details: The order is by the shooting time of the tree's sort, DateTimeOriginal or the file's modified time, and
 * by name for photos taken at the same time, as in the tree (dir-tree-view-sort-comparison.ts). Photos of the same
 * time and name, in two subfolders, are in the order of their paths. It is made from the tree that the folder opened
 * with, once it is needed, and kept until another folder opens.
 */
@Service()
export class SelectPreviousNextService {
  private readonly directoryTreeViewDataService = inject(DirectoryTreeViewDataService);
  private readonly directoryTreeViewSelectionService = inject(DirectoryTreeViewSelectionService);
  private readonly photoDataService = inject(PhotoDataService);
  private readonly selectedPhotoService = inject(SelectedPhotoService);

  private readonly order = computed<ShootingOrder>(() => {
    const files = selectableFiles(this.directoryTreeViewDataService.tree()).map(node => ({
      path: node.path,
      name: node.name,
      shootingTime: shootingTimeOf(this.photoDataService.getPhoto(node.path), node.fsStats.mtime),
    }));
    files.sort((a, b) => compareByShootingTime(a, b) || comparePaths(a.path, b.path));
    const paths = files.map(file => file.path);
    return { paths, indexes: new Map(paths.map((path, index) => [path, index])) };
  });

  /** The path of the one selected photo, which the Selection menu's items act on; null when none or several are. */
  private readonly onlySelectedPhotoPath = computed<string | null>(() => {
    const selectedPhotos = this.selectedPhotoService.selectedPhotos();
    return selectedPhotos.length === 1 ? selectedPhotos[0].path : null;
  });

  /** Which of the Selection menu's items apply. The order is made only once a single photo is selected. */
  private readonly menuState = computed<MenuState>(() => {
    const photoPath = this.onlySelectedPhotoPath();
    return {
      isSelectPreviousMenuEnabled: photoPath !== null && this.previousOf(photoPath) !== null,
      isSelectNextMenuEnabled: photoPath !== null && this.nextOf(photoPath) !== null,
    };
  }, {
    equal: (a, b) => a.isSelectPreviousMenuEnabled === b.isSelectPreviousMenuEnabled
      && a.isSelectNextMenuEnabled === b.isSelectNextMenuEnabled,
  });

  constructor() {
    // From the start, which disables the items again when the page is loaded again, until a single photo is selected.
    effect(() => {
      const menuState = this.menuState();
      bridge().menus.updateSelectPreviousNext(menuState)
        .catch(error => Logger.error('Failed to update the Select Previous and Select Next menus.', error));
    });
  }

  /** The path of the photo taken just before the one at `photoPath`; null for the first, and for one not in the order. */
  public previousOf(photoPath: string): string | null {
    return this.neighborOf(photoPath, -1);
  }

  /** The path of the photo taken just after the one at `photoPath`; null for the last, and for one not in the order. */
  public nextOf(photoPath: string): string | null {
    return this.neighborOf(photoPath, 1);
  }

  /** Selects only the photo at `photoPath`, a neighbor that previousOf() or nextOf() gave, as Select Only This does. */
  public select(photoPath: string): void {
    this.directoryTreeViewSelectionService.select([photoPath]);
  }

  /** The Selection menu's Select Previous: nothing when it does not apply, as when the selection changed meanwhile. */
  public selectPreviousOfSelectedPhoto(): void {
    this.selectNeighborOfSelectedPhoto('Select Previous', photoPath => this.previousOf(photoPath));
  }

  /** The Selection menu's Select Next: nothing when it does not apply, as when the selection changed meanwhile. */
  public selectNextOfSelectedPhoto(): void {
    this.selectNeighborOfSelectedPhoto('Select Next', photoPath => this.nextOf(photoPath));
  }

  private selectNeighborOfSelectedPhoto(item: string, neighborOf: (photoPath: string) => string | null): void {
    const photoPath = this.onlySelectedPhotoPath();
    const neighbor = photoPath === null ? null : neighborOf(photoPath);
    if (neighbor === null) {
      Logger.info(`"${item}" of the Selection menu does not apply to the selection, which stays as it is.`);
      return;
    }
    Logger.info(`"${item}" of the Selection menu selects ${neighbor}, from ${photoPath}.`);
    this.select(neighbor);
  }

  private neighborOf(photoPath: string, offset: -1 | 1): string | null {
    const { paths, indexes } = this.order();
    const index = indexes.get(photoPath);
    return index === undefined ? null : paths[index + offset] ?? null;
  }
}
