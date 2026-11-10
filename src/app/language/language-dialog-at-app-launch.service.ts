import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Logger } from '../../../src-shared/log/logger';
import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';
import { LanguageDialogComponent } from './language-dialog.component';

@Service()
export class LanguageDialogAtAppLaunchService {
  private dialog = inject(MatDialog);

  /**
   * Shows the Language dialog to a user who has not confirmed a language in it yet, and resolves once it is closed,
   * or at once for a user who has. When the user chooses another language than the one on screen, the application
   * restarts instead, so this does not resolve.
   * TL;DR: The language is chosen first, before the Welcome dialog, whose messages are then read in that language.
   * Details: The Welcome dialog says what the application collects, which a user agrees to by using it.
   */
  public async showLanguageDialogIfUserHasNotClickedOk(): Promise<void> {
    const clickedOk = UserDataStorage.readOrDefault(UserDataStoragePath.History.ClickedOkOnLanguageDialog, 'false');
    if (clickedOk.toLowerCase() === 'true')
      return;

    const dialogRef = this.dialog.open(LanguageDialogComponent, {
      width: '420px',
      panelClass: 'custom-dialog-container',
      ariaLabelledBy: 'language-dialog-title',
      // The search field, which is the first element that the Tab key reaches: the user can type a language at once.
      autoFocus: 'first-tabbable',
      restoreFocus: false,
      disableClose: true
    });
    Logger.info('Displayed Language Dialog.');
    await firstValueFrom(dialogRef.afterClosed());
  }
}
