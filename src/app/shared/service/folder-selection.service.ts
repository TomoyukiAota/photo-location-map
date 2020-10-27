import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FolderSelectionService {
  public folderSelected = new Subject<void>();
}
