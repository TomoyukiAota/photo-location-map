import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { bridge } from '../../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../../src-shared/log/logger';

const lineToConfirm = 'Please open Explorer and right-click on a file/folder to confirm.';

@Component({
  selector: 'app-os-settings',
  templateUrl: './os-settings.component.html',
  styleUrl: './os-settings.component.scss',
  imports: [MatButton]
})
export class OsSettingsComponent {
  /** What the last click on Add or Remove did, shown once the main process has answered. */
  public readonly messageLinesAfterButtonClicked = signal<readonly string[]>([]);

  /** Has the main process add "Open with Photo Location Map" in the context menu of Explorer, then says whether it did. */
  public async handleAddButtonClicked() {
    Logger.info('[Settings Dialog] [OS] Clicked "Add" button for Explorer\'s context menu.');
    Analytics.trackEvent('Settings Dialog', '[Settings Dialog] [OS] Click "Add"');
    await this.changeRegistry(() => bridge().explorerContextMenu.add(),
      ['Added "Open with Photo Location Map" in the context menu of Explorer.', lineToConfirm],
      ['Failed to add "Open with Photo Location Map" in the context menu of Explorer.']);
  }

  /** Has the main process remove "Open with Photo Location Map" from the context menu of Explorer, then says whether it did. */
  public async handleRemoveButtonClicked() {
    Logger.info('[Settings Dialog] [OS] Clicked "Remove" button for Explorer\'s context menu.');
    Analytics.trackEvent('Settings Dialog', '[Settings Dialog] [OS] Click "Remove"');
    await this.changeRegistry(() => bridge().explorerContextMenu.remove(),
      ['Removed "Open with Photo Location Map" in the context menu of Explorer.', lineToConfirm],
      ['Failed to remove "Open with Photo Location Map" from the context menu of Explorer.']);
  }

  /** Asks the main process to change the registry, then shows whether it did. The main process logs a failure. */
  private async changeRegistry(change: () => Promise<void>, linesWhenDone: readonly string[], linesWhenFailed: readonly string[]) {
    try {
      await change();
    } catch {
      this.messageLinesAfterButtonClicked.set(linesWhenFailed);
      return;
    }
    this.messageLinesAfterButtonClicked.set(linesWhenDone);
  }
}
