import { Component } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { WelcomeDialogAtAppLaunch } from './welcome-dialog-at-app-launch';

const app = ProxyRequire.electron.remote.app;

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent {
  public readonly appVersion = app.getVersion();

  onOkClicked() {
    WelcomeDialogAtAppLaunch.saveThatUserClickedOk();
  }
}
