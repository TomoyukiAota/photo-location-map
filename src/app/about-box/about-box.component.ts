import { AfterViewInit, Component, ElementRef, viewChild, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { app } from '@electron/remote';

import { openUrl } from '../../../src-shared/url/open-url';
import { IconDataUrl } from '../../assets/icon-data-url';
import { configureOpeningInOsBrowser } from '../shared/open-url/configure-opening-in-os-browser';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-about-box',
  templateUrl: './about-box.component.html',
  styleUrls: ['./about-box.component.scss'],
  imports: [MatIcon]
})
export class AboutBoxComponent implements AfterViewInit {
  private sanitizer = inject(DomSanitizer);

  public readonly appVersion = app.getVersion();

  public readonly releasesLink = viewChild.required<ElementRef<HTMLAnchorElement>>('releasesLink');
  public readonly troubleshootingPageLink = viewChild.required<ElementRef<HTMLAnchorElement>>('troubleshootingPageLink');

  public get xFormerlyTwitterLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.xFormerlyTwitterLogo); }
  public get gitHubLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.gitHubLogo); }

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.releasesLink(), 'https://github.com/TomoyukiAota/photo-location-map/releases',
                                'GitHub Releases', 'About Box');
    configureOpeningInOsBrowser(this.troubleshootingPageLink(), 'https://github.com/TomoyukiAota/photo-location-map/blob/main/docs/troubleshooting/troubleshooting.md',
                                'Troubleshooting Page', 'About Box');
  }

  public handleXFormerlyTwitterProfileIconClicked() {
    openUrl('https://x.com/TomoyukiAota', 'X (Formerly Twitter) Profile of Tomoyuki Aota', 'About Box');
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
