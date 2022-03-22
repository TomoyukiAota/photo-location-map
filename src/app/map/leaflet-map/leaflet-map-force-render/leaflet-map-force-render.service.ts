import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeafletMapForceRenderService {
  public forceRenderWithoutPhotoHappened = new Subject<void>();

  public forceRenderMapWithoutPhoto(): void {
    this.forceRenderWithoutPhotoHappened.next();
  }
}
