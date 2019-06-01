import { Component } from '@angular/core';
import { ElectronService } from './shared/service/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { Logger } from '../../src-shared/log/logger';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public electronService: ElectronService,
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
}
