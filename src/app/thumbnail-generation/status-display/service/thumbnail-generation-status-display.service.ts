import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationStatusDisplayService {
  public closeRequested = new Subject<void>();
}
