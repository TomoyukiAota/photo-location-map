import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { currentLanguage, tIn } from '../../../../src-shared/i18n/i18n';
import { getLanguage, LanguageCode } from '../../../../src-shared/i18n/languages';

export interface ConfirmDialogData {
  /** The question; a line break in it starts a new line. */
  message: string;
  /** The path of the folder or the file that the question is about, shown as it is on the line below it. */
  path?: string;
  /**
   * The language that the question is in, which the buttons are named in as well, when it is not necessarily the
   * application's: the language just chosen in the Settings dialog, before the application restarts in it.
   */
  language?: LanguageCode;
}

/** A question with OK and Cancel, which closes with true for OK (ConfirmDialogService). */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  imports: [MatButton, MatDialogClose]
})
export class ConfirmDialogComponent {
  public readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  private readonly language = this.data.language ?? currentLanguage;

  /**
   * The lang and dir of the question and of the buttons' names, given only for a language of the question's own, as
   * the dialog's are the application's otherwise. The dialog keeps the application's layout either way: the buttons
   * stay at the end of its lines.
   */
  protected readonly textLanguage = this.data.language ?? null;
  protected readonly textDirection = this.data.language ? getLanguage(this.data.language).direction : null;

  protected readonly okLabel = tIn(this.language, 'common.ok');
  protected readonly cancelLabel = tIn(this.language, 'common.cancel');
}
