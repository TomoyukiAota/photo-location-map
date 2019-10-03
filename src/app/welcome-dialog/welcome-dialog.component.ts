import { Component } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';

const app = ProxyRequire.electron.remote.app;

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent {
  public readonly appVersion = app.getVersion();
}
