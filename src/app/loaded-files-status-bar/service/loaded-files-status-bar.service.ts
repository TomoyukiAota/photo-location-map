import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadedFilesStatusBarService {
  public visibilityUpdated = new Subject<boolean>();
  public statusUpdateRequested = new Subject();

  public setVisibility(visible: boolean) {
    console.log(`Test setVisibility ${visible}`);
    this.visibilityUpdated.next(visible);
  }

  public updateStatus(): void {
    this.statusUpdateRequested.next();
  }
}
