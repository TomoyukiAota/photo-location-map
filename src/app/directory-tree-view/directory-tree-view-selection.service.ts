import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DirectoryTreeViewSelectionService {
  public readonly selectionRequested = new BehaviorSubject<string[]>(null); // string for photoPath

  public select(photoPaths: string[]) {
    this.selectionRequested.next(photoPaths);
  }
}
