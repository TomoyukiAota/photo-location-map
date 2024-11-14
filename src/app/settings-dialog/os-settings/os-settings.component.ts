import { Component } from '@angular/core';
import { addRegistryForExplorerContextMenu } from './add-registry-for-explorer-context-menu';
import { deleteRegistryForExplorerContextMenu } from './delete-registry-for-explorer-context-menu';

@Component({
  selector: 'app-os-settings',
  templateUrl: './os-settings.component.html',
  styleUrl: './os-settings.component.scss'
})
export class OsSettingsComponent {
  public async handleAddButtonClicked() {
    await addRegistryForExplorerContextMenu();
  }

  public async handleRemoveButtonClicked() {
    await deleteRegistryForExplorerContextMenu();
  }
}
