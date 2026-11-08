import { Service } from '@angular/core';
import { Subject } from 'rxjs';

@Service()
export class LeafletMapForceRenderService {
  public forceRenderWithoutPhotoHappened = new Subject<void>();

  public forceRenderMapWithoutPhoto(): void {
    this.forceRenderWithoutPhotoHappened.next();
  }
}
