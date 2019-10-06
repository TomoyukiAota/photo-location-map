import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ProxyRequire } from '../../../src-shared/require/proxy-require';
import { configureOpeningInOsBrowser } from '../shared/configure-opening-in-os-browser';

const app = ProxyRequire.electron.remote.app;

@Component({
  selector: 'app-about-box',
  templateUrl: './about-box.component.html',
  styleUrls: ['./about-box.component.scss']
})
export class AboutBoxComponent implements AfterViewInit {
  public readonly appVersion = app.getVersion();

  @ViewChild('gitHubRepoLink', { static: false }) public gitHubRepoLink: ElementRef<HTMLAnchorElement>;
  @ViewChild('authorLink', { static: false }) public authorLink: ElementRef<HTMLAnchorElement>;

  public ngAfterViewInit() {
    configureOpeningInOsBrowser(this.gitHubRepoLink, 'https://github.com/TomoyukiAota/photo-location-map');
    configureOpeningInOsBrowser(this.authorLink, 'https://github.com/TomoyukiAota');
  }
}
