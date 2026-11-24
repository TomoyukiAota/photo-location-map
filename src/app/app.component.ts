import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { recordUnhandledError } from '../../src-shared/analytics/record-error';
import { Logger } from '../../src-shared/log/logger';
import { PlmInternalRendererService } from '../global-variables/plm-internal-renderer.service';
import { DropHintComponent } from './drop-to-open/drop-hint/drop-hint.component';
import { DropToOpenService } from './drop-to-open/drop-to-open.service';
import { LanguageDialogAtAppLaunchService } from './language/language-dialog-at-app-launch.service';
import { PhotoSelectionHistoryService } from './shared/service/photo-selection-history.service';
import { ThumbnailSizeService } from './shared/thumbnail-size/thumbnail-size.service';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [DropHintComponent, RouterOutlet],
  // The drag events of the whole window, over a dialog too: a folder or a file dropped on it opens (DropToOpenService).
  // The boxes of a thumbnail in the sidebar and in the map's popups, which the viewer of every photo below reads in its
  // styles by its place (ThumbnailSizeService).
  host: {
    '[style.--plm-thumbnail-box-sidebar]': 'thumbnailSizeService.sidebarBox()',
    '[style.--plm-thumbnail-box-map]': 'thumbnailSizeService.mapBox()',
    '(window:dragstart)': 'dropToOpenService.dragStart()',
    '(window:dragend)': 'dropToOpenService.dragEnd()',
    '(window:dragenter)': 'dropToOpenService.dragEnter($event)',
    '(window:dragover)': 'dropToOpenService.dragOver($event)',
    '(window:dragleave)': 'dropToOpenService.dragLeave($event)',
    '(window:drop)': 'dropToOpenService.drop($event)',
  },
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly dropToOpenService = inject(DropToOpenService);
  protected readonly thumbnailSizeService = inject(ThumbnailSizeService);
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
