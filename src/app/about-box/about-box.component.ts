import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { shell } from 'electron';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { IconDataUrl } from '../../assets/icon-data-url';
import { configureOpeningInOsBrowser } from '../shared/configure-opening-in-os-browser';

const app = ProxyRequire.electron.remote.app;

@Component({
  selector: 'app-about-box',
  templateUrl: './about-box.component.html',
  styleUrls: ['./about-box.component.scss']
})
export class AboutBoxComponent implements AfterViewInit {
  public readonly appVersion = app.getVersion();

  @ViewChild('releasesLink') public releasesLink: ElementRef<HTMLAnchorElement>;
  @ViewChild('developedByLink') public developedByLink: ElementRef<HTMLAnchorElement>;
  @ViewChild('gitHubIssuesLink') public gitHubIssuesLink: ElementRef<HTMLAnchorElement>;

  public get gitHubLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.gitHubLogo); }

  constructor(private sanitizer: DomSanitizer) {
  }

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.releasesLink, 'https://github.com/TomoyukiAota/photo-location-map/releases');
    configureOpeningInOsBrowser(this.developedByLink, 'https://github.com/TomoyukiAota');
    configureOpeningInOsBrowser(this.gitHubIssuesLink, 'https://github.com/TomoyukiAota/photo-location-map/issues');
  }

  public handleHomeIconClicked() {
    // noinspection JSIgnoredPromiseFromCall
    shell.openExternal('https://tomoyukiaota.github.io/photo-location-map/');
    Logger.info(`Opened Project Home Page.`);
    Analytics.trackEvent(`Opened Project Home Page`, '');
  }

  public handleGitHubLogoClicked() {
    // noinspection JSIgnoredPromiseFromCall
    shell.openExternal('https://github.com/TomoyukiAota/photo-location-map');
    Logger.info(`Opened GitHub Repository.`);
    Analytics.trackEvent(`Opened GitHub Repository`, '');
  }
}
