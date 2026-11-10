import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { TranslatePipe } from '../i18n/translate.pipe';

export interface ConfirmDialogData {
  /** The question; a line break in it starts a new line. */
  message: string;
}

/** A question with OK and Cancel, which closes with true for OK (ConfirmDialogService). */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  imports: [MatButton, MatDialogClose, TranslatePipe]
})
export class ConfirmDialogComponent {
  public readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
