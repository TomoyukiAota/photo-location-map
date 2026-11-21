import { BooleanSettingType } from '../../../../src-shared/user-settings/boolean-setting';
import { StickyFolderRowsLeftOut } from '../../../../src-shared/user-settings/sticky-folder-rows';

export class AppearanceSettingsChangedParameter {
  showStatusBar: BooleanSettingType;
  stickyFolderRowsMaximum: number;
  stickyFolderRowsLeftOut: StickyFolderRowsLeftOut;
}
