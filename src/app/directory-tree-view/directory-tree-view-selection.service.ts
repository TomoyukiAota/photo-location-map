import { Service } from '@angular/core';
import { Subject } from 'rxjs';

@Service()
export class DirectoryTreeViewSelectionService {
  /**
   * Requests to select the photos of these paths in the tree and to deselect the others. An event, not state: the tree
   * view handles each request when it is made, and the tree view exists from the start, so no request is missed.
   */
  public readonly selectionRequested = new Subject<string[]>(); // string for photoPath

  /**
   * Requests to select the photo of this path in the tree too, keeping the others selected, as a click on its
   * checkbox would. An event, as selectionRequested is.
   */
  public readonly additionRequested = new Subject<string>(); // string for photoPath

  public select(photoPaths: string[]) {
    this.selectionRequested.next(photoPaths);
  }

  public add(photoPath: string) {
    this.additionRequested.next(photoPath);
  }
}
