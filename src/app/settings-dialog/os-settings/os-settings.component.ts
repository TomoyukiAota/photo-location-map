import { Component } from '@angular/core';
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
    await addRegistryForExplorerContextMenu();
    this.messageLinesAfterButtonClicked = [
      'Added "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ];
  }

  public async handleRemoveButtonClicked() {
    await deleteRegistryForExplorerContextMenu();
    this.messageLinesAfterButtonClicked = [
      'Removed "Open with Photo Location Map" in the context menu of Explorer.',
      'Please open Explorer and right-click on a file/folder to confirm.',
    ];
  }
}
