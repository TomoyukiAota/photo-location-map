import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as child_process from 'child_process';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import { Command } from '../../../../src-shared/command/command';
import { Logger } from '../../../../src-shared/log/logger';
import { getSizeInStringFormat } from '../../../../src-shared/plm-fs-util/plm-fs-util';
import { RequireFromMainProcess } from '../../../../src-shared/require/require-from-main-process';
import { plmThumbnailCacheDir } from '../../../../src-shared/thumbnail-cache/thumbnail-cache-util';
import { configureOpeningInOsBrowser } from '../../shared/open-url/configure-opening-in-os-browser';

@Component({
  selector: 'app-cache-settings',
  templateUrl: './cache-settings.component.html',
  styleUrls: ['./cache-settings.component.scss']
})
export class CacheSettingsComponent implements AfterViewInit, OnDestroy, OnInit {
  public thumbnailCacheLocation = plmThumbnailCacheDir;
  public thumbnailCacheSize: string;
  public updateThumbnailCacheSizeIntervalId: NodeJS.Timeout;

  @ViewChild('heifWikipediaLink') public heifWikipediaLink: ElementRef<HTMLAnchorElement>;

  ngOnInit(): void {
    fsExtra.ensureDirSync(this.thumbnailCacheLocation);
    const { size, errors } = getSizeInStringFormat(this.thumbnailCacheLocation);
    this.thumbnailCacheSize = size;
    if (errors.length) {
      Logger.warn(`Error(s) detected during getting the size of "${this.thumbnailCacheLocation}"`);
    }
    errors.forEach(error => Logger.warn(`Detected Error: ${error}`, error));

    this.updateThumbnailCacheSizeIntervalId = setInterval(() => {
      this.thumbnailCacheSize =  getSizeInStringFormat(this.thumbnailCacheLocation).size;
    }, 1000);
  }

  ngAfterViewInit() {
    configureOpeningInOsBrowser(this.heifWikipediaLink, 'https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format');
  }

  ngOnDestroy(): void {
    clearInterval(this.updateThumbnailCacheSizeIntervalId);
  }

  public openThumbnailCacheLocation(): void {
    const command = Command.toRunAssociatedApp(this.thumbnailCacheLocation);
    if (command) {
      child_process.spawn(command, [], { shell: true });
      Logger.info(`Issued a command: ${command}`);
      Logger.info(`Opened Thumbnail Cache Location by opening "${this.thumbnailCacheLocation}"`);
    } else {
      Logger.warn(`"Open Thumbnail Cache Location" is not supported on this platform: ${os.platform()}`);
    }
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
