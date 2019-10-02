import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';

const app = ProxyRequire.electron.remote.app;
const shell = ProxyRequire.electron.shell;

@Component({
  selector: 'app-about-box',
  templateUrl: './about-box.component.html',
  styleUrls: ['./about-box.component.scss']
})
export class AboutBoxComponent implements AfterViewInit {
  public readonly appVersion = app.getVersion();

  @ViewChild('gitHubRepoLink', { static: false }) gitHubRepoLink: ElementRef<HTMLAnchorElement>;
  @ViewChild('authorLink', { static: false }) authorLink: ElementRef<HTMLAnchorElement>;

  public ngAfterViewInit() {
    this.configureOpeningInOsBrowser(this.gitHubRepoLink, 'https://github.com/TomoyukiAota/photo-location-map');
    this.configureOpeningInOsBrowser(this.authorLink, 'https://github.com/TomoyukiAota');
  }

  private configureOpeningInOsBrowser(elementRef: ElementRef<HTMLAnchorElement>, url: string) {
    elementRef.nativeElement.addEventListener('click', event => {
      event.preventDefault();
      // noinspection JSIgnoredPromiseFromCall
      shell.openExternal(url);
    });
  }
}
