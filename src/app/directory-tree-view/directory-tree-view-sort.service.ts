import { Injectable } from '@angular/core';
import * as moment from 'moment/moment';
import { BehaviorSubject } from 'rxjs';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { NestedNode } from './directory-tree-view.model';

export class DirectoryTreeViewSortConfig {
  public key: 'Name' | 'ShootingDateTime';
  public direction: 'Ascending' | 'Descending';
}

type SortConfig = DirectoryTreeViewSortConfig;

@Injectable({
  providedIn: 'root'
})
export class DirectoryTreeViewSortService {
  public readonly sortRequested = new BehaviorSubject<SortConfig>({key: 'Name', direction: 'Ascending'});

  constructor(private photoDataService: PhotoDataService) { }

  public requestSortingData(sortConfig: SortConfig) {
    this.sortRequested.next(sortConfig);
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
    } else { // if ShootingDateTime
      if (a.type === 'directory') {
        return this.compareNodesUsingSortConfig(a, b, {key: 'Name', direction});
      } else { // if a.type === 'file'
        return this.compareNodesUsingSortConfig(a, b, {key: 'ShootingDateTime', direction});
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
    } else if (sortConfig.key === 'ShootingDateTime') {
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
}
