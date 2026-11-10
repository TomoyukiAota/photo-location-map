import { AfterViewInit, Component, ElementRef, viewChild, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { Analytics } from '../../../src-shared/analytics/analytics';
import { Logger } from '../../../src-shared/log/logger';
import { startupMetadata } from '../../../src-shared/startup/startup-metadata';
import { openUrl } from '../../../src-shared/url/open-url';
import { IconDataUrl } from '../../assets/icon-data-url';
import { TagPartsPipe } from '../shared/i18n/tag-parts.pipe';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { configureOpeningInOsBrowser } from '../shared/open-url/configure-opening-in-os-browser';
import { WelcomeDialogAtAppLaunchService } from './welcome-dialog-at-app-launch/welcome-dialog-at-app-launch.service';
import { MatButton } from '@angular/material/button';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-welcome-dialog',
  templateUrl: './welcome-dialog.component.html',
  styleUrls: ['./welcome-dialog.component.scss'],
  imports: [MatButton, MatDialogClose, TranslatePipe, TagPartsPipe]
})
export class WelcomeDialogComponent implements AfterViewInit {
  private sanitizer = inject(DomSanitizer);
  private welcomeDialogAtAppLaunchService = inject(WelcomeDialogAtAppLaunchService);

  public readonly appVersion = startupMetadata().version;

  public readonly troubleshootingPageLink = viewChild.required<ElementRef<HTMLAnchorElement>>('troubleshootingPageLink');

  public get xFormerlyTwitterLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.xFormerlyTwitterLogo); }
  public get gitHubLogoDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.gitHubLogo); }

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.troubleshootingPageLink(), 'https://github.com/TomoyukiAota/photo-location-map/blob/main/docs/troubleshooting/troubleshooting.md',
                                'Troubleshooting Page', 'Welcome Dialog');
  }

  public handleXFormerlyTwitterProfileIconClicked() {
    openUrl('https://x.com/TomoyukiAota', 'X (Formerly Twitter) Profile of Tomoyuki Aota', 'Welcome Dialog');
  }

  public handleGitHubProfileIconClicked() {
    openUrl('https://github.com/TomoyukiAota', 'GitHub Profile of Tomoyuki Aota', 'Welcome Dialog');
  }

  public onOkClicked() {
    Logger.info(`[Welcome Dialog] Clicked OK button`);
    Analytics.trackEvent(`Welcome Dialog`, '[Welcome Dialog] Clicked OK button');
    this.welcomeDialogAtAppLaunchService.saveThatUserClickedOk();
  }
}
