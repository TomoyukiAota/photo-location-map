import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BooleanSetting } from '../../../../src-shared/user-settings/boolean-setting';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

@Injectable({
  providedIn: 'root'
})
export class LoadedFilesStatusBarService {
  public visible = new Subject<boolean>();
  public statusUpdateRequested = new Subject<void>();

  public setInitialVisibility() {
    const showStatusBar = BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
    this.setVisibility(showStatusBar);
  }

  public setVisibility(visible: boolean) {
    this.visible.next(visible);
  }

  public restoreVisibilityToSettingValue() {
    const showStatusBar = BooleanSetting.convertToBoolean(currentUserSettings.showStatusBar);
    this.setVisibility(showStatusBar);
  }

  public updateStatus(): void {
    this.statusUpdateRequested.next();
  }
}
