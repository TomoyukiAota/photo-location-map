import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PlmInternalRendererService } from '../global-variables/plm-internal-renderer.service';
import { PhotoSelectionHistoryService } from './shared/service/photo-selection-history.service';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(private plmInternalRendererService: PlmInternalRendererService,
              private photoSelectionHistoryService: PhotoSelectionHistoryService,
              private translate: TranslateService,
              private welcomeDialogAtAppLaunchService: WelcomeDialogAtAppLaunchService) {
    translate.setDefaultLang('en');
  }

  public ngOnInit(): void {
    this.plmInternalRendererService.initialize();
    this.photoSelectionHistoryService.reset(); // Disable Undo/Redo menus after the application frontend is reloaded.
  }

  public ngAfterViewInit(): void {
    this.welcomeDialogAtAppLaunchService.showWelcomeDialogIfUserHasNotClickedOk();
  }

  public ngOnDestroy(): void {
    this.plmInternalRendererService.destroy();
  }
}
