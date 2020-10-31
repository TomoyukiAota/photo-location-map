import { Component, OnDestroy, OnInit } from '@angular/core';
import * as child_process from 'child_process';
import * as fsExtra from 'fs-extra';
import * as os from 'os';
import { Command } from '../../../../src-shared/command/command';
import { Logger } from '../../../../src-shared/log/logger';
import { getSizeInStringBytes } from '../../../../src-shared/plm-fs-util/plm-fs-util';
import { plmThumbnailCacheDir } from '../../../../src-shared/thumbnail/thumbnail-generation-util';

@Component({
  selector: 'app-cache-settings',
  templateUrl: './cache-settings.component.html',
  styleUrls: ['./cache-settings.component.scss']
})
export class CacheSettingsComponent implements OnDestroy, OnInit {
  public thumbnailCacheLocation = plmThumbnailCacheDir;
  public thumbnailCacheSize: string;
  public updateThumbnailCacheSizeIntervalId: NodeJS.Timeout;

  ngOnInit(): void {
    fsExtra.ensureDirSync(this.thumbnailCacheLocation);
    const { size, errors } = getSizeInStringBytes(this.thumbnailCacheLocation);
    this.thumbnailCacheSize = size;
    if (errors.length) {
      Logger.warn(`Error(s) detected during getting the size of "${this.thumbnailCacheLocation}"`);
    }
    errors.forEach(error => Logger.warn(`Detected Error: ${error}`, error));

    this.updateThumbnailCacheSizeIntervalId = setInterval(() => {
      this.thumbnailCacheSize =  getSizeInStringBytes(this.thumbnailCacheLocation).size;
    }, 1000);
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
}
