import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadedFilesStatusBarService {
  public updateRequested = new Subject();

  public update(): void {
    this.updateRequested.next();
  }
}
