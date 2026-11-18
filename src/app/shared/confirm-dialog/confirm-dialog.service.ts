import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { appName } from '../../../../src-shared/i18n/i18n';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

@Service()
export class ConfirmDialogService {
  private dialog = inject(MatDialog);

  /**
   * Asks `message` with OK and Cancel, and resolves with whether OK was clicked; Escape and a click outside the dialog
   * are a Cancel. A question about a folder or a file has its `path` on the line below it.
   * TL;DR: The application's own dialog rather than window.confirm, whose buttons are not in the application's language.
   * Details: window.confirm is shown by Chromium, in the language of the operating system, whatever the Language
   * setting is.
   */
  public async confirm(message: string, path?: string): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      // As wide as the longest line of the question, in any language, so that a line is not broken in two.
      minWidth: '360px',
      panelClass: 'custom-dialog-container',
      role: 'alertdialog',
      ariaLabel: appName,
      data: path === undefined ? { message } : { message, path },
      restoreFocus: false,
    });
    return await firstValueFrom(dialogRef.afterClosed()) === true;
  }
}
