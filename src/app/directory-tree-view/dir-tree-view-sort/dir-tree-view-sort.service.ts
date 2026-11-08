import { computed, Injectable, signal, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment/moment';
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
import {
  DirTreeViewSortShootingTimeInfoComponent
} from './shooting-time-info/dir-tree-view-sort-shooting-time-info.component';

type SortKey = DirTreeViewSortKey;
type SortDirection = DirTreeViewSortDirection;
type SortConfig = DirTreeViewSortConfig;
const defaultSortConfig = defaultDirTreeViewSortConfig;

@Injectable({
  providedIn: 'root'
})
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

  private compareNodesUsingSortConfig(a: NestedNode, b: NestedNode, sortConfig: SortConfig): number {
    if (sortConfig.key === 'Name') {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (sortConfig.direction === 'Ascending') {
        return nameA < nameB ? -1 : 1;
      } else { // if Descending
        return nameA < nameB ? 1 : -1;
      }
    } else if (sortConfig.key === 'ShootingTime') {
      const momentA = this.getMoment(a);
      const momentB = this.getMoment(b);
      if (sortConfig.direction === 'Ascending') {
        return momentA < momentB ? -1 : 1;
      } else { // if Descending
        return momentA < momentB ? 1 : -1;
      }
    }

    console.error('Something went wrong. This line should not run.');
    return 0;
  }

  private getMoment(node: NestedNode) {
    const momentOfDateTimeOriginal = this.photoDataService.getPhoto(node.path)?.exif?.dateTimeOriginal?.moment;
    const momentForThisNode = momentOfDateTimeOriginal ?? moment(node.fsStats.mtime);
    return momentForThisNode;
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
