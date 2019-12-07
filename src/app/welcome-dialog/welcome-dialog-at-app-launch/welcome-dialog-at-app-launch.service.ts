import { Injectable } from '@angular/core';
import { UserDataStorage } from '../../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../../src-shared/user-data-storage/user-data-stroage-path';

@Injectable({
  providedIn: 'root'
})
export class WelcomeDialogAtAppLaunchService {
  public showWelcomeDialogIfUserHasNotClickedOk() {
    const clickedOkOnWelcomeDialogStr = UserDataStorage.readOrDefault(
      UserDataStoragePath.History.ClickedOkOnWelcomeDialog,
      'false');
    const clickedOkOnWelcomeDialog = clickedOkOnWelcomeDialogStr.toLowerCase() === 'true';

    if (!clickedOkOnWelcomeDialog)
      window.plmInternalRenderer.welcomeDialog.showWelcomeDialog();
  }

  public saveThatUserClickedOk() {
    UserDataStorage.write(UserDataStoragePath.History.ClickedOkOnWelcomeDialog, true.toString());
  }
}
