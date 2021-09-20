import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';

@Component({
  selector: 'app-appearance-settings',
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss']
})
export class AppearanceSettingsComponent {
  constructor(private loadedFilesStatusBarService: LoadedFilesStatusBarService) { }

  public handleShowStatusBarCheckboxChanged(change: MatCheckboxChange) {
    this.loadedFilesStatusBarService.setVisibility(change.checked);
  }
}
