import { UserDataStorage } from '../../../src-shared/user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../../../src-shared/user-data-storage/user-data-stroage-path';

export class WelcomeDialogAtAppLaunch {
  public static showWelcomeDialogIfUserHasNotClickedOk() {
    let clickedOkOnWelcomeScreen = false;

    try {
      clickedOkOnWelcomeScreen = UserDataStorage.read(UserDataStoragePath.History.ClickedOkOnWelcomeDialog).toLowerCase() === 'true';
    } catch {
      clickedOkOnWelcomeScreen = false;
    }

    if (!clickedOkOnWelcomeScreen)
      window.plmInternalRenderer.welcomeDialog.showWelcomeDialog();
  }

  public static saveThatUserClickedOk() {
    UserDataStorage.write(UserDataStoragePath.History.ClickedOkOnWelcomeDialog, true.toString());
  }
}
