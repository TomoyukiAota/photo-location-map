import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../src-shared/log/logger';
import { AppConfig } from '../environments/environment';
import { PlmInternalRenderer, PlmInternalRendererAboutBox } from '../global-variables/global-variable-for-internal-use-in-renderer';
import { ElectronService } from './shared/service/electron.service';
import { AboutBoxComponent } from './about-box/about-box.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
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
  }

  public ngOnDestroy(): void {
    window.plmInternalRenderer.aboutBox.showAboutBox = null;
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
}
