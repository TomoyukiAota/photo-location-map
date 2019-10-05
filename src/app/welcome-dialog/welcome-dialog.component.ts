import { Component } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

const app = ProxyRequire.electron.remote.app;

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent {
  public readonly appVersion = app.getVersion();

  constructor(private welcomeDialogAtAppLaunchService: WelcomeDialogAtAppLaunchService) {
  }

  onOkClicked() {
    this.welcomeDialogAtAppLaunchService.saveThatUserClickedOk();
  }
}
