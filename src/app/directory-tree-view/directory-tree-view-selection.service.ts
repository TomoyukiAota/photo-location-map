import { Service } from '@angular/core';
import { Subject } from 'rxjs';

@Service()
export class DirectoryTreeViewSelectionService {
  /**
   * Requests to select the photos of these paths in the tree and to deselect the others. An event, not state: the tree
   * view handles each request when it is made, and the tree view exists from the start, so no request is missed.
   */
  public readonly selectionRequested = new Subject<string[]>(); // string for photoPath

  public select(photoPaths: string[]) {
    this.selectionRequested.next(photoPaths);
  }
}
