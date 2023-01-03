import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as fsExtra from 'fs-extra';
import { openWithAssociatedApp } from '../../../../src-shared/command/command';
import { Logger } from '../../../../src-shared/log/logger';
import { RequireFromMainProcess } from '../../../../src-shared/require/require-from-main-process';
import { plmThumbnailCacheDir } from '../../../../src-shared/thumbnail/cache/thumbnail-cache-util';
import { configureOpeningInOsBrowser } from '../../shared/open-url/configure-opening-in-os-browser';

@Component({
  selector: 'app-cache-settings',
  templateUrl: './cache-settings.component.html',
  styleUrls: ['./cache-settings.component.scss']
})
export class CacheSettingsComponent implements AfterViewInit, OnInit {
  public thumbnailCacheLocation = plmThumbnailCacheDir;

  @ViewChild('heifWikipediaLink') public heifWikipediaLink: ElementRef<HTMLAnchorElement>;

  ngOnInit(): void {
    fsExtra.ensureDirSync(this.thumbnailCacheLocation);
  }

  ngAfterViewInit() {
    configureOpeningInOsBrowser(this.heifWikipediaLink, 'https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format',
                                'HEIF page in Wikipedia', 'Settings Dialog] [Cache');
  }

  public openThumbnailCacheLocation(): void {
    Logger.info(`Open Thumbnail Cache Location: ${this.thumbnailCacheLocation}`);
    openWithAssociatedApp(this.thumbnailCacheLocation);
  }

  public handleDeleteThumbnailCacheButtonClicked() {
    const isOkPressed = window.confirm('This application will restart after deleting the thumbnail cache.\nDo you want to continue?');
    if (!isOkPressed)
      return;

    fsExtra.emptyDirSync(this.thumbnailCacheLocation);
    Logger.info(`Thumbnail cache is deleted, so the application will restart.`);
    RequireFromMainProcess.electron.app.relaunch();
    RequireFromMainProcess.electron.app.exit(0);
  }
}
