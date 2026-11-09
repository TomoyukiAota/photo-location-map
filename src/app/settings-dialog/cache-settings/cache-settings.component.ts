import { AfterViewInit, Component, ElementRef, viewChild } from '@angular/core';
import { bridge } from '../../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../../src-shared/log/logger';
import { startupMetadata } from '../../../../src-shared/startup/startup-metadata';
import { configureOpeningInOsBrowser } from '../../shared/open-url/configure-opening-in-os-browser';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-cache-settings',
  templateUrl: './cache-settings.component.html',
  styleUrls: ['./cache-settings.component.scss'],
  imports: [MatButton]
})
export class CacheSettingsComponent implements AfterViewInit {
  public thumbnailCacheLocation = startupMetadata().thumbnailCacheDir;

  public readonly heifWikipediaLink = viewChild.required<ElementRef<HTMLAnchorElement>>('heifWikipediaLink');

  ngAfterViewInit() {
    configureOpeningInOsBrowser(this.heifWikipediaLink(), 'https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format',
                                'HEIF page in Wikipedia', 'Settings Dialog] [Cache');
  }

  /** The main process makes the folder if it is not there, then opens it with the OS. */
  public openThumbnailCacheLocation(): void {
    Logger.info(`Open Thumbnail Cache Location: ${this.thumbnailCacheLocation}`);
    bridge().thumbnailCache.open()
      .catch(error => Logger.error(`Failed to open the thumbnail cache location.`, error));
  }

  /** Once the user confirms, has the main process delete the thumbnail cache and restart the app. */
  public handleDeleteThumbnailCacheButtonClicked() {
    const isOkPressed = window.confirm('This application will restart after deleting the thumbnail cache.\nDo you want to continue?');
    if (!isOkPressed)
      return;

    // The main process empties the cache, then restarts the app, which ends this page.
    bridge().thumbnailCache.deleteAndRestart()
      .catch(error => Logger.error(`Failed to delete the thumbnail cache.`, error));
  }
}
