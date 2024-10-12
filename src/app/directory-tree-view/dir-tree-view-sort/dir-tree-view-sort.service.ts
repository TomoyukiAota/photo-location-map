import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment/moment';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { Analytics } from '../../../../src-shared/analytics/analytics';
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
  public readonly sortKey$ = new BehaviorSubject<SortKey>(defaultSortConfig.key);
  public readonly sortDirection$ = new BehaviorSubject<SortDirection>(defaultSortConfig.direction);
  public readonly sortConfig$ = new BehaviorSubject<SortConfig>(defaultSortConfig);

  constructor(private dialog: MatDialog,
              private photoDataService: PhotoDataService,
  ) {
    this.loadSortKeyFromUserDataStorage();
    this.configureSavingSortKeyWhenChanged();

    this.loadSortDirectionFromUserDataStorage();
    this.configureSavingSortDirectionWhenChanged();

    this.configureSortConfig();
  }

  private loadSortKeyFromUserDataStorage() {
    const sortKey = UserDataStorage.readOrDefault(
      UserDataStoragePath.DirectoryTreeView.SortKey,
      defaultSortConfig.key,
    ) as SortKey;
    this.sortKey$.next(sortKey);
  }

  private configureSavingSortKeyWhenChanged() {
    // No need of unsubscribing since sortKey$ exists for the entire application lifetime.
    this.sortKey$.subscribe(sortKey => {
      UserDataStorage.write(UserDataStoragePath.DirectoryTreeView.SortKey, sortKey);
      Analytics.trackEvent('Directory Tree View', `[Tree View] Sort Key`, `Changed Sort Key to ${sortKey}`);
    });
  }

  private loadSortDirectionFromUserDataStorage() {
    const sortDirection = UserDataStorage.readOrDefault(
      UserDataStoragePath.DirectoryTreeView.SortDirection,
      defaultSortConfig.direction,
    ) as SortDirection;
    this.sortDirection$.next(sortDirection);
  }

  private configureSavingSortDirectionWhenChanged() {
    // No need of unsubscribing since sortDirection$ exists for the entire application lifetime.
    this.sortDirection$.subscribe(sortDirection => {
      UserDataStorage.write(UserDataStoragePath.DirectoryTreeView.SortDirection, sortDirection);
      Analytics.trackEvent('Directory Tree View', `[Tree View] Sort Direction`, `Changed Sort Direction to ${sortDirection}`);
    });
  }

  private configureSortConfig() {
    const sortConfigObservable$ = combineLatest([this.sortKey$, this.sortDirection$]).pipe(map(([key, direction]) => {
      return {key, direction};
    }));
    sortConfigObservable$.subscribe(this.sortConfig$); // No need of unsubscribing since sortKey$ and sortDirection$ exist for the entire application lifetime.
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
      width: '600px',
      height: '490px',
      panelClass: 'custom-dialog-container',
      disableClose: false,
      autoFocus: false,
      restoreFocus: false
    });
  }
}
