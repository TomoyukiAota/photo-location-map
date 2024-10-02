import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenFolderService {
  public isFolderOpened$ = new BehaviorSubject(false);
}
