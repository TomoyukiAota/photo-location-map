import { Injectable, signal } from '@angular/core';
import { BooleanSetting } from '../../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

@Injectable({
  providedIn: 'root'
})
export class LoadedFilesStatusBarService {
  private readonly visibleState = signal(LoadedFilesStatusBarService.readSetting());
  /** Whether the status bar is shown: the "Show Status Bar" setting, or the value being tried in the settings dialog. */
  public readonly visible = this.visibleState.asReadonly();

  public setVisibility(visible: boolean) {
    this.visibleState.set(visible);
  }

  public restoreVisibilityToSettingValue() {
    this.setVisibility(LoadedFilesStatusBarService.readSetting());
  }

  private static readSetting(): boolean {
    return BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
  }
}
