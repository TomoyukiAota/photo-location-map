import { signal, Service } from '@angular/core';
import { BooleanSetting } from '../../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

@Service()
export class LoadedFilesStatusBarService {
  private readonly visibleState = signal(LoadedFilesStatusBarService.readSetting());
  /** Whether the status bar is shown: the "Show Status Bar" setting, or the value being tried in the settings dialog. */
  public readonly visible = this.visibleState.asReadonly();

  /** Shows or hides the status bar, as the settings dialog does while its checkbox is changed. */
  public setVisibility(visible: boolean) {
    this.visibleState.set(visible);
  }

  /** Goes back to the "Show Status Bar" setting, as Cancel in the settings dialog does. */
  public restoreVisibilityToSettingValue() {
    this.setVisibility(LoadedFilesStatusBarService.readSetting());
  }

  private static readSetting(): boolean {
    return BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
  }
}
