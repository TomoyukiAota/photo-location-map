import { Component, inject } from '@angular/core';
import { BooleanSetting } from '../../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { SettingsChangedService } from '../service/settings-changed.service';
import { AppearanceSettingsChangedParameter } from './appearance-settings-changed-parameter';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appearance-settings',
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss'],
  imports: [MatCheckbox, FormsModule, TranslatePipe]
})
export class AppearanceSettingsComponent {
  private settingsChangedService = inject(SettingsChangedService);
  private loadedFilesStatusBarService = inject(LoadedFilesStatusBarService);

  public shouldShowStatusBar: boolean;

  constructor() {
    this.shouldShowStatusBar = BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
  }

  public handleShowStatusBarCheckboxChanged() {
    this.loadedFilesStatusBarService.setVisibility(this.shouldShowStatusBar);
    const parameter = new AppearanceSettingsChangedParameter();
    parameter.showStatusBar = BooleanSetting.convertToSettingValue(this.shouldShowStatusBar);
    this.settingsChangedService.appearanceSettingsChanged.next(parameter);
  }
}
