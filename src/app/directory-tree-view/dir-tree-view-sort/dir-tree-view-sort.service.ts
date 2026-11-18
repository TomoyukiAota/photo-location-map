import { computed, signal, inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { NestedNode } from '../directory-tree-view.model';
import {
  defaultDirTreeViewSortConfig,
  DirTreeViewSortConfig,
  DirTreeViewSortDirection,
  DirTreeViewSortKey,
} from './dir-tree-view-sort-config';
import { compareByShootingTime, compareNames, shootingTimeOf, ShootingTimeSortKey } from './dir-tree-view-sort-comparison';
import {
  DirTreeViewSortShootingTimeInfoComponent
} from './shooting-time-info/dir-tree-view-sort-shooting-time-info.component';

type SortKey = DirTreeViewSortKey;
type SortDirection = DirTreeViewSortDirection;
type SortConfig = DirTreeViewSortConfig;
const defaultSortConfig = defaultDirTreeViewSortConfig;

@Service()
export class DirTreeViewSortService {
  private dialog = inject(MatDialog);
  private photoDataService = inject(PhotoDataService);

  private readonly sortKeyState = signal<SortKey>(DirTreeViewSortService.readSortKey());
  private readonly sortDirectionState = signal<SortDirection>(DirTreeViewSortService.readSortDirection());
  public readonly sortKey = this.sortKeyState.asReadonly();
  public readonly sortDirection = this.sortDirectionState.asReadonly();
  public readonly sortConfig = computed<SortConfig>(() => new DirTreeViewSortConfig(this.sortKey(), this.sortDirection()));

  // The setters save what is chosen. Reading the saved values at startup writes nothing back.
  public setSortKey(sortKey: SortKey): void {
    this.sortKeyState.set(sortKey);
    UserDataStorage.write(UserDataStoragePath.DirectoryTreeView.SortKey, sortKey);
  }

  public setSortDirection(sortDirection: SortDirection): void {
    this.sortDirectionState.set(sortDirection);
    UserDataStorage.write(UserDataStoragePath.DirectoryTreeView.SortDirection, sortDirection);
  }

  private static readSortKey(): SortKey {
    return UserDataStorage.readOrDefault(UserDataStoragePath.DirectoryTreeView.SortKey, defaultSortConfig.key) as SortKey;
  }

  private static readSortDirection(): SortDirection {
    return UserDataStorage.readOrDefault(UserDataStoragePath.DirectoryTreeView.SortDirection, defaultSortConfig.direction) as SortDirection;
  }

  public sortData(data: NestedNode[], sortConfig: SortConfig): NestedNode[] {
    if (data.length === 0) { return data; }

    const rootNode = data[0];
    this.sortNestedNodeRecursively(rootNode, sortConfig);
    return data;
  }

  private sortNestedNodeRecursively(node: NestedNode, sortConfig: SortConfig) {
    if (!node?.children) { return; }

    node.children.forEach(child => {
      if (child.children) {
        this.sortNestedNodeRecursively(child, sortConfig);
      }
    });
    node.children.sort((a, b) => this.compareNodes(a, b, sortConfig));
  }

  private compareNodes(a: NestedNode, b: NestedNode, sortConfig: SortConfig) {
    if (a.type === b.type) { // if both a and b are directories or files
      return this.compareNodesOfSameType(a, b, sortConfig);
    }
    return a.type > b.type ? 1 : -1; // Directories are listed first, and then files are listed second.
  }

  private compareNodesOfSameType(a: NestedNode, b: NestedNode, sortConfig: SortConfig) {
    const direction = sortConfig.direction;
    if (sortConfig.key === 'Name') {
      return this.compareNodesUsingSortConfig(a, b, {key: 'Name', direction});
    } else { // if ShootingTime
      if (a.type === 'directory') {
        return this.compareNodesUsingSortConfig(a, b, {key: 'Name', direction});
      } else { // if a.type === 'file'
        return this.compareNodesUsingSortConfig(a, b, {key: 'ShootingTime', direction});
      }
    }
  }

  // The comparisons are those of dir-tree-view-sort-comparison.ts, which Select Previous and Select Next go through the
  // photos by too (SelectPreviousNextService). Descending is the reverse of ascending, files taken at the same time too.
  private compareNodesUsingSortConfig(a: NestedNode, b: NestedNode, sortConfig: SortConfig): number {
    let ascendingOrder: number;
    if (sortConfig.key === 'Name') {
      ascendingOrder = compareNames(a.name, b.name);
    } else if (sortConfig.key === 'ShootingTime') {
      ascendingOrder = compareByShootingTime(this.shootingTimeSortKey(a), this.shootingTimeSortKey(b));
    } else {
      console.error('Something went wrong. This line should not run.');
      return 0;
    }
    return sortConfig.direction === 'Ascending' ? ascendingOrder : -ascendingOrder;
  }

  private shootingTimeSortKey(node: NestedNode): ShootingTimeSortKey {
    return { shootingTime: shootingTimeOf(this.photoDataService.getPhoto(node.path), node.fsStats.mtime), name: node.name };
  }

  public showShootingTimeInfoDialog() {
    this.dialog.open(DirTreeViewSortShootingTimeInfoComponent, {
      width: '800px',
      height: '360px',
      panelClass: 'custom-dialog-container',
      disableClose: false,
      autoFocus: false,
      restoreFocus: false
    });
  }
}
