import { Component, computed, inject, Signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

/** What the dialog of the search for faces shows: the search's progress, or what came of it. */
export type FaceSearchDialogState =
  | { readonly kind: 'searching'; readonly done: number; readonly total: number; readonly waitingForThumbnails: boolean }
  | { readonly kind: 'noFacesFound' }
  | { readonly kind: 'notLookedAt'; readonly count: number }
  | { readonly kind: 'failed' };

/** What the search gives its dialog (face-search.service.ts). */
export interface FaceSearchDialogData {
  readonly state: Signal<FaceSearchDialogState>;
  /** How many photos are selected, the largest number that the dialog may show, whose room its lines keep. */
  readonly photoCount: Signal<number>;
  readonly cancel: () => void;
}

/**
 * The dialog of the Selection menu's Narrow Down to Photos with Faces: while the photos are looked at, how many have
 * been, that this happens on this computer only, and Cancel; then, when the selection did not simply narrow down,
 * why. The search closes it otherwise. It keeps its height while it is open, whatever it shows (the styles).
 */
@Component({
  selector: 'app-face-search-dialog',
  templateUrl: './face-search-dialog.component.html',
  styleUrls: ['./face-search-dialog.component.scss'],
  imports: [MatButton, MatDialogClose, MatProgressBar, TranslatePipe],
})
export class FaceSearchDialogComponent {
  private readonly data = inject<FaceSearchDialogData>(MAT_DIALOG_DATA);

  public readonly state = this.data.state;
  public readonly photoCount = this.data.photoCount;
  /** How far the search is, from 0 to 100. */
  public readonly percent = computed(() => {
    const state = this.state();
    return state.kind === 'searching' && state.total > 0 ? 100 * state.done / state.total : 0;
  });

  public cancel(): void {
    this.data.cancel();
  }
}
