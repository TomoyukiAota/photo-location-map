import { Component } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { Logger } from '../../../../src-shared/log/logger';
import { addRegistryForExplorerContextMenu } from './add-registry-for-explorer-context-menu';
import { deleteRegistryForExplorerContextMenu } from './delete-registry-for-explorer-context-menu';

@Component({
  selector: 'app-os-settings',
  templateUrl: './os-settings.component.html',
  styleUrl: './os-settings.component.scss'
})
export class OsSettingsComponent {
  public messageLinesAfterButtonClicked: string[] = [];

  public async handleAddButtonClicked() {
    Logger.info('[Settings Dialog] [OS] Clicked "Add" button for Explorer\'s context menu.');
    Analytics.trackEvent('Settings Dialog', '[Settings Dialog] [OS] Click "Add"');
    await addRegistryForExplorerContextMenu();
    this.messageLinesAfterButtonClicked = [
      'Added "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ];
  }

  public async handleRemoveButtonClicked() {
    Logger.info('[Settings Dialog] [OS] Clicked "Remove" button for Explorer\'s context menu.');
    Analytics.trackEvent('Settings Dialog', '[Settings Dialog] [OS] Click "Remove"');
    await deleteRegistryForExplorerContextMenu();
    this.messageLinesAfterButtonClicked = [
      'Removed "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ];
  }
}
