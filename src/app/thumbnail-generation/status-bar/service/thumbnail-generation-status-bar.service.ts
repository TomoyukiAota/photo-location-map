import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThumbnailGenerationStatusBarService {
  private readonly visibleState = signal(false);
  private readonly detailsVisibleState = signal(false);
  /** Whether the status bar is shown: from the start of a generation until it is closed or another folder opens. */
  public readonly visible = this.visibleState.asReadonly();
  /** Whether the details under the progress bar are open. Each generation starts with them closed. */
  public readonly detailsVisible = this.detailsVisibleState.asReadonly();

  public showForNewGeneration(): void {
    this.detailsVisibleState.set(false);
    this.visibleState.set(true);
  }

  public hide(): void {
    this.visibleState.set(false);
  }

  public toggleDetails(): void {
    this.detailsVisibleState.update(visible => !visible);
  }
}
