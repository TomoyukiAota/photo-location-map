import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OsmForceRenderService {
  public forceRenderWithoutPhotoHappened = new Subject<void>();

  public forceRenderOsmWithoutPhoto(): void {
    this.forceRenderWithoutPhotoHappened.next();
  }
}
