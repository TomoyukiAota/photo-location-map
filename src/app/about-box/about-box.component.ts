import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { app } from '@electron/remote';

import { openUrl } from '../../../src-shared/url/open-url';
import { IconDataUrl } from '../../assets/icon-data-url';
import { configureOpeningInOsBrowser } from '../shared/open-url/configure-opening-in-os-browser';

@Component({
  selector: 'app-about-box',
  templateUrl: './about-box.component.html',
  styleUrls: ['./about-box.component.scss']
})
export class AboutBoxComponent implements AfterViewInit {
  public readonly appVersion = app.getVersion();

  @ViewChild('releasesLink') public releasesLink: ElementRef<HTMLAnchorElement>;
  @ViewChild('troubleshootingPageLink') public troubleshootingPageLink: ElementRef<HTMLAnchorElement>;

  public get twitterLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.twitterLogo); }
  public get gitHubLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.gitHubLogo); }

  constructor(private sanitizer: DomSanitizer) {
  }

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.releasesLink, 'https://github.com/TomoyukiAota/photo-location-map/releases',
                                'GitHub Releases', 'About Box');
    configureOpeningInOsBrowser(this.troubleshootingPageLink, 'https://github.com/TomoyukiAota/photo-location-map/blob/main/docs/troubleshooting/troubleshooting.md',
                                'Troubleshooting Page', 'About Box');
  }

  public handleTwitterProfileIconClicked() {
    openUrl('https://twitter.com/TomoyukiAota', 'Twitter Profile of Tomoyuki Aota', 'About Box');
  }

  public handleGitHubProfileIconClicked() {
    openUrl('https://github.com/TomoyukiAota', 'GitHub Profile of Tomoyuki Aota', 'About Box');
  }

  public handleHomeIconClicked() {
    openUrl('https://tomoyukiaota.github.io/photo-location-map/', 'Home Page', 'About Box');
  }

  public handleSourceCodeIconClicked() {
    openUrl('https://github.com/TomoyukiAota/photo-location-map', 'Source Code in GitHub', 'About Box');
  }
}
