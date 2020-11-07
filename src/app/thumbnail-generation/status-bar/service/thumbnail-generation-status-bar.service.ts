import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationStatusBarService {
  public closeRequested = new Subject<void>();
}
