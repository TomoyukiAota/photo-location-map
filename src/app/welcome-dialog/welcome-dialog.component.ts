import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { shell } from 'electron';

import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { IconDataUrl } from '../../assets/icon-data-url';
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

  @ViewChild('gitHubIssuesLink') public gitHubIssuesLink: ElementRef<HTMLAnchorElement>;

  public get twitterLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.twitterLogo); }
  public get gitHubLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.gitHubLogo); }

  constructor(private sanitizer: DomSanitizer,
              private welcomeDialogAtAppLaunchService: WelcomeDialogAtAppLaunchService) {
  }

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.gitHubIssuesLink, 'https://github.com/TomoyukiAota/photo-location-map/issues');
  }

  public handleTwitterProfileIconClicked() {
    // noinspection JSIgnoredPromiseFromCall
    shell.openExternal('https://twitter.com/TomoyukiAota');
    Logger.info(`Opened Twitter Profile of Tomoyuki Aota on Welcome Dialog.`);
    Analytics.trackEvent(`Opened Twitter Profile of Tomoyuki Aota on Welcome Dialog`, '');
  }

  public handleGitHubProfileIconClicked() {
    // noinspection JSIgnoredPromiseFromCall
    shell.openExternal('https://github.com/TomoyukiAota');
    Logger.info(`Opened GitHub Profile of Tomoyuki Aota on Welcome Dialog.`);
    Analytics.trackEvent(`Opened GitHub Profile of Tomoyuki Aota on Welcome Dialog`, '');
  }

  public onOkClicked() {
    Logger.info(`Clicked "OK" button on Welcome Dialog.`);
    Analytics.trackEvent(`Clicked "OK" button on Welcome Dialog`, '');
    this.welcomeDialogAtAppLaunchService.saveThatUserClickedOk();
  }
}
