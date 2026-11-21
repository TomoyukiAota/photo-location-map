import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSelect } from '@angular/material/select';
import { TranslationKey } from '../../../../src-shared/i18n/translation-key';
import { BooleanSetting } from '../../../../src-shared/user-settings/boolean-setting';
import {
  StickyFolderRowsLeftOut,
  stickyFolderRowsLeftOutChoices,
  stickyFolderRowsMaximumChoices,
} from '../../../../src-shared/user-settings/sticky-folder-rows';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';
import { LoadedFilesStatusBarService } from '../../loaded-files-status-bar/service/loaded-files-status-bar.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { SettingsChangedService } from '../service/settings-changed.service';
import { AppearanceSettingsChangedParameter } from './appearance-settings-changed-parameter';

/** The text of each choice of the folders left out (src-shared/user-settings/sticky-folder-rows.ts). */
const leftOutLabels: Record<StickyFolderRowsLeftOut, TranslationKey> = {
  middle: 'settings.appearance.stickyFolders.middle',
  nearOpenedFolder: 'settings.appearance.stickyFolders.nearOpenedFolder',
  nearPhotos: 'settings.appearance.stickyFolders.nearPhotos',
};

/**
 * The Appearance tab: the status bar, and the rows of the folders that the folder tree keeps at its top while it is
 * scrolled, how many at most and which folders they leave out when there are more. Show Status Bar applies while it is
 * changed, and Cancel restores it (RestoreSettingsService); the rows apply once saved (SettingsDialogComponent).
 */
@Component({
  selector: 'app-appearance-settings',
  templateUrl: './appearance-settings.component.html',
  styleUrls: ['./appearance-settings.component.scss'],
  imports: [MatCheckbox, FormsModule, MatFormField, MatLabel, MatSelect, MatOption, MatRadioGroup, MatRadioButton, TranslatePipe]
})
export class AppearanceSettingsComponent {
  private settingsChangedService = inject(SettingsChangedService);
  private loadedFilesStatusBarService = inject(LoadedFilesStatusBarService);

  public shouldShowStatusBar: boolean;
  protected selectedMaximum = currentUserSettings.stickyFolderRowsMaximum;
  protected selectedLeftOut: StickyFolderRowsLeftOut = currentUserSettings.stickyFolderRowsLeftOut;

  protected readonly maximumChoices = stickyFolderRowsMaximumChoices;
  /** The choices, one on a line, which the field's box is as wide as (settings-styles). */
  protected readonly maximumChoicesText = stickyFolderRowsMaximumChoices.join('\n');
  protected readonly leftOutChoices = stickyFolderRowsLeftOutChoices.map(value => ({ value, label: leftOutLabels[value] }));

  constructor() {
    this.shouldShowStatusBar = BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
  }

  public handleShowStatusBarCheckboxChanged() {
    this.loadedFilesStatusBarService.setVisibility(this.shouldShowStatusBar);
    this.notifySettingsChanged();
  }

  /** Tells the dialog the settings of the tab as they are now, which Save saves. */
  protected notifySettingsChanged() {
    const parameter = new AppearanceSettingsChangedParameter();
    parameter.showStatusBar = BooleanSetting.convertToSettingValue(this.shouldShowStatusBar);
    parameter.stickyFolderRowsMaximum = this.selectedMaximum;
    parameter.stickyFolderRowsLeftOut = this.selectedLeftOut;
    this.settingsChangedService.appearanceSettingsChanged.next(parameter);
  }
}
