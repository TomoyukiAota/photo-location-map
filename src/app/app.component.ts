import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { recordUnhandledError } from '../../src-shared/analytics/record-error';
import { Logger } from '../../src-shared/log/logger';
import { PlmInternalRendererService } from '../global-variables/plm-internal-renderer.service';
import { LanguageDialogAtAppLaunchService } from './language/language-dialog-at-app-launch.service';
import { PhotoSelectionHistoryService } from './shared/service/photo-selection-history.service';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private languageDialogAtAppLaunchService = inject(LanguageDialogAtAppLaunchService);
  private photoSelectionHistoryService = inject(PhotoSelectionHistoryService);
  private plmInternalRendererService = inject(PlmInternalRendererService);
  private welcomeDialogAtAppLaunchService = inject(WelcomeDialogAtAppLaunchService);

  public ngOnInit(): void {
    this.plmInternalRendererService.initialize();
    this.photoSelectionHistoryService.reset(); // Disable Undo/Redo menus after the application frontend is reloaded.
  }

  public ngAfterViewInit(): void {
    void this.showDialogsAtAppLaunch();
  }

  /**
   * The Language dialog first, for a user who has not confirmed a language, then the Welcome dialog, for one who has not
   * clicked its OK: its messages are read in the language that the user chose. Another language than the one on screen
   * restarts the application, which shows the Welcome dialog at its next launch.
   * TL;DR: The Welcome dialog is shown also when the Language dialog fails.
   * Details: The Welcome dialog says what the application collects, which a user agrees to by using the application,
   * so a failure before it must not keep it away. The failure is logged and recorded as an unhandled one is.
   */
  private async showDialogsAtAppLaunch(): Promise<void> {
    try {
      await this.languageDialogAtAppLaunchService.showLanguageDialogIfUserHasNotClickedOk();
    } catch (error) {
      Logger.error('Failed to show the Language dialog. The Welcome dialog is shown next.', error);
      recordUnhandledError(error, 'Renderer');
    }
    this.welcomeDialogAtAppLaunchService.showWelcomeDialogIfUserHasNotClickedOk();
  }

  public ngOnDestroy(): void {
    this.plmInternalRendererService.destroy();
  }
}
