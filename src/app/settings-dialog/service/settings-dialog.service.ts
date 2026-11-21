import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Logger } from '../../../../src-shared/log/logger';
import { SettingsDialogComponent, SettingsDialogData, SettingsTabId } from '../settings-dialog.component';

/** Opens the Settings dialog: from the menu, on its first tab, or on another, as from the status bar of thumbnails. */
@Service()
export class SettingsDialogService {
  private readonly dialog = inject(MatDialog);

  public open(initialTab?: SettingsTabId): void {
    this.dialog.open<SettingsDialogComponent, SettingsDialogData>(SettingsDialogComponent, {
      width: '1000px',
      height: '600px',
      panelClass: 'custom-dialog-container',
      autoFocus: false,
      restoreFocus: false,
      disableClose: true,
      data: { initialTab },
    });
    Logger.info(`Displayed Settings Dialog${initialTab ? ` on the tab ${initialTab}` : ''}.`);
  }
}
