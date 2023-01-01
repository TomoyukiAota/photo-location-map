import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenFolderService {
  public folderOpened = new Subject<void>();
}
