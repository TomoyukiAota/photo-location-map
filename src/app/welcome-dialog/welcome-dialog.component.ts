import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { configureOpeningInOsBrowser } from '../shared/configure-opening-in-os-browser';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';

const app = ProxyRequire.electron.remote.app;

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss']
})
export class WelcomeDialogComponent implements AfterViewInit {
  public readonly appVersion = app.getVersion();

  @ViewChild('developedByLink') public developedByLink: ElementRef<HTMLAnchorElement>;
  @ViewChild('gitHubIssuesLink') public gitHubIssuesLink: ElementRef<HTMLAnchorElement>;

  constructor(private welcomeDialogAtAppLaunchService: WelcomeDialogAtAppLaunchService) {
  }

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.developedByLink, 'https://github.com/TomoyukiAota');
    configureOpeningInOsBrowser(this.gitHubIssuesLink, 'https://github.com/TomoyukiAota/photo-location-map/issues');
  }

  onOkClicked() {
    this.welcomeDialogAtAppLaunchService.saveThatUserClickedOk();
  }
}
