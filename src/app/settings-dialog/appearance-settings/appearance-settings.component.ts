import { Component } from '@angular/core';
import { BooleanSetting } from '../../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { SettingsChangedService } from '../service/settings-changed.service';
import { AppearanceSettingsChangedParameter } from './appearance-settings-changed-parameter';

@Component({
  selector: 'app-appearance-settings',
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss']
})
export class AppearanceSettingsComponent {
  public shouldShowStatusBar: boolean;

  constructor(private settingsChangedService: SettingsChangedService,
              private loadedFilesStatusBarService: LoadedFilesStatusBarService) {
    this.shouldShowStatusBar = BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
  }

  public handleShowStatusBarCheckboxChanged() {
    this.loadedFilesStatusBarService.setVisibility(this.shouldShowStatusBar);
    const parameter = new AppearanceSettingsChangedParameter();
    parameter.showStatusBar = BooleanSetting.convertToSettingValue(this.shouldShowStatusBar);
    this.settingsChangedService.appearanceSettingsChanged.next(parameter);
  }
}
