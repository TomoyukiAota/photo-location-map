import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../src-shared/log/logger';
import { AppConfig } from '../environments/environment';
import {
  PlmInternalRenderer,
  PlmInternalRendererAboutBox,
  PlmInternalRendererWelcomeDialog
} from '../global-variables/global-variable-for-internal-use-in-renderer';
import { ElectronService } from './shared/service/electron.service';
import { AboutBoxComponent } from './about-box/about-box.component';
import { WelcomeDialogComponent } from './welcome-dialog/welcome-dialog.component';
import { WelcomeDialogAtAppLaunch } from './welcome-dialog/welcome-dialog-at-app-launch';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(private dialog: MatDialog,
              private ngZone: NgZone,
              public electronService: ElectronService,
              private translate: TranslateService) {

    translate.setDefaultLang('en');
    Logger.info('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      Logger.info('Mode electron');
      Logger.info('Electron ipcRenderer', electronService.ipcRenderer);
      Logger.info('NodeJS childProcess', electronService.childProcess);
    } else {
      Logger.info('Mode web');
    }
  }

  public ngOnInit(): void {
    window.plmInternalRenderer = window.plmInternalRenderer || new PlmInternalRenderer();

    window.plmInternalRenderer.aboutBox = window.plmInternalRenderer.aboutBox || new PlmInternalRendererAboutBox();
    window.plmInternalRenderer.aboutBox.showAboutBox = () => this.showAboutBox();

    window.plmInternalRenderer.welcomeDialog = window.plmInternalRenderer.welcomeDialog || new PlmInternalRendererWelcomeDialog();
    window.plmInternalRenderer.welcomeDialog.showWelcomeDialog = () => this.showWelcomeDialog();
  }

  public ngAfterViewInit(): void {
    WelcomeDialogAtAppLaunch.showWelcomeDialogIfUserHasNotClickedOk();
  }

  public ngOnDestroy(): void {
    window.plmInternalRenderer.aboutBox.showAboutBox = null;
    window.plmInternalRenderer.welcomeDialog.showWelcomeDialog = null;
  }

  public showAboutBox(): void {
    this.ngZone.run(() => {
      this.dialog.open(AboutBoxComponent, {
        width: '350px',
        height: '300px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false
      });
      Logger.info('Displayed About Box.');
    });
  }

  public showWelcomeDialog(): void {
    this.ngZone.run(() => {
      this.dialog.open(WelcomeDialogComponent, {
        width: '600px',
        height: '400px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false,
        disableClose: true
      });
      Logger.info('Displayed Welcome Dialog.');
    });
  }
}
