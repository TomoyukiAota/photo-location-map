import { AfterViewInit, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../src-shared/log/logger';
import {
  PlmInternalRenderer,
  PlmInternalRendererAboutBox,
  PlmInternalRendererPhotoSelection,
  PlmInternalRendererSettingsDialog,
  PlmInternalRendererWelcomeDialog
} from '../global-variables/global-variable-for-internal-use-in-renderer';
import { AboutBoxComponent } from './about-box/about-box.component';
import { DirectoryTreeViewSelectionService } from './directory-tree-view/directory-tree-view-selection.service';
import { SettingsDialogComponent } from './settings-dialog/settings-dialog.component';
import { WelcomeDialogComponent } from './welcome-dialog/welcome-dialog.component';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog/welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(private dialog: MatDialog,
              private ngZone: NgZone,
              private directoryTreeViewSelectionService: DirectoryTreeViewSelectionService,
              private translate: TranslateService,
              private welcomeDialogAtAppLaunchService: WelcomeDialogAtAppLaunchService) {
    translate.setDefaultLang('en');
  }

  public ngOnInit(): void {
    window.plmInternalRenderer = window.plmInternalRenderer || new PlmInternalRenderer();

    window.plmInternalRenderer.aboutBox = window.plmInternalRenderer.aboutBox || new PlmInternalRendererAboutBox();
    window.plmInternalRenderer.aboutBox.showAboutBox = () => this.showAboutBox();

    window.plmInternalRenderer.settingsDialog = window.plmInternalRenderer.settingsDialog || new PlmInternalRendererSettingsDialog();
    window.plmInternalRenderer.settingsDialog.showSettingsDialog = () => this.showSettingsDialog();

    window.plmInternalRenderer.welcomeDialog = window.plmInternalRenderer.welcomeDialog || new PlmInternalRendererWelcomeDialog();
    window.plmInternalRenderer.welcomeDialog.showWelcomeDialog = () => this.showWelcomeDialog();

    window.plmInternalRenderer.photoSelection = window.plmInternalRenderer.photoSelection || new PlmInternalRendererPhotoSelection();
    window.plmInternalRenderer.photoSelection.selectOnlyThis = (photoPath) => this.selectOnlyThis(photoPath);
  }

  public ngAfterViewInit(): void {
    this.welcomeDialogAtAppLaunchService.showWelcomeDialogIfUserHasNotClickedOk();
  }

  public ngOnDestroy(): void {
    window.plmInternalRenderer.aboutBox.showAboutBox = null;
    window.plmInternalRenderer.settingsDialog.showSettingsDialog = null;
    window.plmInternalRenderer.welcomeDialog.showWelcomeDialog = null;
  }

  public showAboutBox(): void {
    this.ngZone.run(() => {
      this.dialog.open(AboutBoxComponent, {
        width: '500px',
        height: '420px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false
      });
      Logger.info('Displayed About Box.');
    });
  }

  private showSettingsDialog() {
    this.ngZone.run(() => {
      this.dialog.open(SettingsDialogComponent, {
        width: '1000px',
        height: '600px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false,
        disableClose: true
      });
      Logger.info('Displayed Settings Dialog.');
    });
  }

  public showWelcomeDialog(): void {
    this.ngZone.run(() => {
      this.dialog.open(WelcomeDialogComponent, {
        width: '620px',
        height: '490px',
        panelClass: 'custom-dialog-container',
        autoFocus: false,
        restoreFocus: false,
        disableClose: true
      });
      Logger.info('Displayed Welcome Dialog.');
    });
  }

  private selectOnlyThis(photoPath: string) {
    this.ngZone.run(() => {
      this.directoryTreeViewSelectionService.select([photoPath]);
      Logger.debug(`Called AppComponent::selectOnlyThis for ${photoPath}`);
    });
  }
}
