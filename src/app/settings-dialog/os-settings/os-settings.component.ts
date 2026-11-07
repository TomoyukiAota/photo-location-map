import { Component, signal } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../src-shared/log/logger';
import { addRegistryForExplorerContextMenu } from './add-registry-for-explorer-context-menu';
import { deleteRegistryForExplorerContextMenu } from './delete-registry-for-explorer-context-menu';

@Component({
  selector: 'app-os-settings',
  templateUrl: './os-settings.component.html',
  styleUrl: './os-settings.component.scss',
  standalone: false
})
export class OsSettingsComponent {
  /** What the last click on Add or Remove did, shown once the registry has been changed. */
  public readonly messageLinesAfterButtonClicked = signal<readonly string[]>([]);

  public async handleAddButtonClicked() {
    Logger.info('[Settings Dialog] [OS] Clicked "Add" button for Explorer\'s context menu.');
    Analytics.trackEvent('Settings Dialog', '[Settings Dialog] [OS] Click "Add"');
    await addRegistryForExplorerContextMenu();
    this.messageLinesAfterButtonClicked.set([
      'Added "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ]);
  }

  public async handleRemoveButtonClicked() {
    Logger.info('[Settings Dialog] [OS] Clicked "Remove" button for Explorer\'s context menu.');
    Analytics.trackEvent('Settings Dialog', '[Settings Dialog] [OS] Click "Remove"');
    await deleteRegistryForExplorerContextMenu();
    this.messageLinesAfterButtonClicked.set([
      'Removed "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ]);
  }
}
