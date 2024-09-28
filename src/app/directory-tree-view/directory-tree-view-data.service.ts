import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { PhotoDataService } from '../shared/service/photo-data.service';
import { NestedNode } from './directory-tree-view.model';

/**
 * Tree view data service. This can build a tree structured object for tree view.
 */
@Injectable({
  providedIn: 'root'
})
export class DirectoryTreeViewDataService {
  public readonly dataReplaced = new BehaviorSubject<NestedNode[]>([]);

  constructor(private photoDataService: PhotoDataService) {
  }

  public replace(directoryTreeObject: DirectoryTree): void {
    const nestedNodeArray = this.convertToNestedNodeArray([directoryTreeObject]);
    if (nestedNodeArray.length > 0) {
      this.sortNestedNodeRecursively(nestedNodeArray[0]);
    }
    this.dataReplaced.next(nestedNodeArray);
  }

  private convertToNestedNodeArray(directoryTreeArray: DirectoryTree[]): NestedNode[] {
    const nestedNodeArray = directoryTreeArray.map(directoryTree => {
      const nestedNode = new NestedNode();
      nestedNode.name = directoryTree.name;
      nestedNode.path = directoryTree.path;
      nestedNode.type = directoryTree.type;
      nestedNode.fsStats = directoryTree['fsStats'];
      nestedNode.isSelectable = this.isSelectableNode(directoryTree);
      nestedNode.children = !!directoryTree.children
        ? this.convertToNestedNodeArray(directoryTree.children)
        : [];
      return nestedNode;
    });
    return nestedNodeArray;
  }

  private isSelectableNode(directoryTree: DirectoryTree): boolean {
    const isFile = directoryTree.type === 'file';
    if (isFile) {
      const isGpsInfoAvailable = !!this.photoDataService.getGpsInfo(directoryTree.path);
      return isGpsInfoAvailable;
    }

    const someChildrenSelectable = directoryTree.children.some(child => {
      return this.isSelectableNode(child);
    });
    return someChildrenSelectable;
  }

  private sortNestedNodeRecursively(node: NestedNode) {
    if (!node?.children) { return; }

    node.children.forEach(child => {
      if (child.children) {
        this.sortNestedNodeRecursively(child);
      }
    });
    node.children.sort((a, b) => this.compareNodes(a, b));
  }

  private compareNodes(a: NestedNode, b: NestedNode) {
    if (a.type === b.type) { // if both a and b are directories or files
      return this.compareNodesOfSameType(a, b);
    }
    return a.type > b.type ? 1 : -1; // Directories are listed first, and then files are listed second.
  }

  private compareNodesOfSameType(a: NestedNode, b: NestedNode) {
    const sortType: 'Alphabetical' | 'TimeTaken' = 'TimeTaken';
    const sortOrder: 'Ascending' | 'Descending' = 'Ascending';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (sortType === 'Alphabetical') {
      return this.compareNodesUsingSortConfig(a, b, 'Alphabetical', sortOrder);
    } else { // if TimeTaken
      if (a.type === 'directory') {
        return this.compareNodesUsingSortConfig(a, b, 'Alphabetical', sortOrder);
      } else { // if a.type === 'file'
        return this.compareNodesUsingSortConfig(a, b, 'TimeTaken', sortOrder);
      }
    }
  }

  private compareNodesUsingSortConfig(a: NestedNode, b: NestedNode, sortType: 'Alphabetical' | 'TimeTaken', sortOrder: 'Ascending' | 'Descending'): number {
    if (sortType === 'Alphabetical') {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (sortOrder === 'Ascending') {
        return nameA < nameB ? -1 : 1;
      } else { // if Descending
        return nameA < nameB ? 1 : -1;
      }
    } else if (sortType === 'TimeTaken') {
      const momentA = this.getMoment(a);
      const momentB = this.getMoment(b);
      if (sortOrder === 'Ascending') {
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
