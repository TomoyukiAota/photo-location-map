import { Analytics } from '../../../src-shared/analytics/analytics';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { isFilePathTooLongOnWindows, maxFilePathLengthOnWindows } from '../../../src-shared/max-file-path-length-on-windows/max-file-path-length-on-windows';
import { getThumbnailFilePath, isThumbnailCacheAvailable } from '../../../src-shared/thumbnail/cache/thumbnail-cache-util';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Photo } from '../shared/model/photo.model';
import { PhotoViewerLauncher } from '../photo-viewer-launcher/photo-viewer-launcher';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';


export class ThumbnailElement {
  public static create(photo: Photo): { thumbnailElement: HTMLImageElement; thumbnailContainerElement: HTMLDivElement } {
    const thumbnailElement = this.createThumbnailElement(photo);
    const thumbnailContainerElement = this.createThumbnailContainerElement(thumbnailElement);
    return { thumbnailElement, thumbnailContainerElement };
  }

  private static createThumbnailElement(photo: Photo) {
    const thumbnailElement = document.createElement('img');
    thumbnailElement.loading = 'lazy';
    thumbnailElement.className = 'photo-info-viewer-thumbnail';
    thumbnailElement.onclick = () => this.handleThumbnailClick(photo);

    const isThumbnailAvailableFromExif = !!(photo?.exif?.thumbnail);
    const isPhotoDisplayableInBrowser = FilenameExtension.isDisplayableInBrowser(photo.filenameExtension);
    const isThumbnailGenerationAvailable = FilenameExtension.isThumbnailGenerationAvailable(photo.filenameExtension);

    if (isThumbnailAvailableFromExif) {
      this.displayThumbnailFromExif(thumbnailElement, photo);
    } else if (isPhotoDisplayableInBrowser) {
      this.displayThumbnailUsingPhotoItself(thumbnailElement, photo);
    } else if (isThumbnailGenerationAvailable) {
      this.displayThumbnailAfterWaitingForGeneration(thumbnailElement, photo);
    } else {
      this.displayNoThumbnailAvailableImage(thumbnailElement, photo);
    }

    return thumbnailElement;
  }

  private static displayThumbnailFromExif(thumbnailElement: HTMLImageElement, photo: Photo) {
    this.configureThumbnailToFitWithinContainer(thumbnailElement);
    thumbnailElement.src = photo.exif.thumbnail.objectUrl;
  }

  private static displayThumbnailUsingPhotoItself(thumbnailElement: HTMLImageElement, photo: Photo) {
    this.displayThumbnailUsingFile(thumbnailElement, photo, photo.path);
    this.handlePathTooLongCaseOnWindowsWhenUsingPhotoForThumbnail(thumbnailElement, photo);
  }

  private static displayThumbnailAfterWaitingForGeneration(thumbnailElement: HTMLImageElement, photo: Photo) {
    const cssClassAppliedToGeneratingThumbnailImage = 'photo-info-viewer-generating-thumbnail';
    const cssClassToFadeInAfterThumbnailGeneration = 'photo-info-viewer-fade-in-after-thumbnail-generation';

    this.displayGeneratingThumbnailImage(thumbnailElement, photo);
    thumbnailElement.classList.add(cssClassAppliedToGeneratingThumbnailImage);

    const intervalId = setInterval(() => {
      if (isThumbnailCacheAvailable(photo.path)) {
        thumbnailElement.classList.remove(cssClassAppliedToGeneratingThumbnailImage);

        // Apply and remove the CSS class in order for thumbnail to fade in just once after its generation is done.
        thumbnailElement.classList.add(cssClassToFadeInAfterThumbnailGeneration);
        setTimeout(() => thumbnailElement.classList.remove(cssClassToFadeInAfterThumbnailGeneration), 2500); // 2000 ms for animation definition plus 500 ms for processing lag.

        this.displayGeneratedThumbnail(photo, thumbnailElement);
        clearInterval(intervalId);
      }
    }, 1000);
  }

  private static displayGeneratedThumbnail(photo: Photo, thumbnailElement: HTMLImageElement) {
    const { thumbnailFilePath } = getThumbnailFilePath(photo.path);
    this.displayThumbnailUsingFile(thumbnailElement, photo, thumbnailFilePath);
    this.handlePathTooLongCaseOnWindowsForGeneratedThumbnail(thumbnailElement, photo, thumbnailFilePath);
  }

  private static handlePathTooLongCaseOnWindowsWhenUsingPhotoForThumbnail(thumbnailElement: HTMLImageElement, photo: Photo) {
    if (isFilePathTooLongOnWindows(photo.path)) {
      thumbnailElement.alt = `Thumbnail cannot be displayed because the length of the file path is ${photo.path.length}. `
        + `Windows restricts the maximum path length to ${maxFilePathLengthOnWindows}. Please change file location to shorten the path of the file. `
        + `For details, press Ctrl+Shift+I and read the console messages.`;
      logger.warn(`\n`
        + `Thumbnail of ${photo.name} cannot be displayed because the length of the file path exceeds the maximum.\n`
        + `Please change the location of ${photo.name} to shorten the path.\n`
        + `-------------------------------\n`
        + `Maximum file path length: ${maxFilePathLengthOnWindows}\n`
        + `File path length of ${photo.name}: ${photo.path.length}\n`
        + `-------------------------------\n`
        + `File path of ${photo.name} is "${photo.path}"\n`
      );
    }
  }

  private static handlePathTooLongCaseOnWindowsForGeneratedThumbnail(thumbnailElement: HTMLImageElement, photo: Photo, thumbnailFilePath: string) {
    if (isFilePathTooLongOnWindows(thumbnailFilePath)) {
      thumbnailElement.alt = `Thumbnail cannot be displayed because the length of the file path of the generated thumbnail is ${thumbnailFilePath.length}. `
                           + `Windows restricts the maximum path length to ${maxFilePathLengthOnWindows}. Please change file location to shorten the path of the generated thumbnail. `
                           + `For details, press Ctrl+Shift+I and read the console messages.`;
      logger.warn(`\n`
                + `Thumbnail of ${photo.name} cannot be displayed because the length of the file path of the generated thumbnail exceeds the maximum.\n`
                + `Please change the location of ${photo.name} to shorten the path of the generated thumbnail.\n`
                + `-------------------------------\n`
                + `Maximum file path length: ${maxFilePathLengthOnWindows}\n`
                + `File path length of ${photo.name}: ${photo.path.length}\n`
                + `File path length of generated thumbnail: ${thumbnailFilePath.length}\n`
                + `-------------------------------\n`
                + `File path of ${photo.name} is "${photo.path}"\n`
                + `-------------------------------\n`
                + `File path of generated thumbnail is "${thumbnailFilePath}"\n`
      );
    }
  }

  private static displayThumbnailUsingFile(thumbnailElement: HTMLImageElement, photo: Photo, thumbnailFilePath: string) {
    this.configureThumbnailToFitWithinContainer(thumbnailElement);
    const imgSrcPath = thumbnailFilePath.replace(/#/g, '%23');  // # needs to be escaped. See https://www.w3schools.com/tags/ref_urlencode.asp for encoding.
    thumbnailElement.src = `file://${imgSrcPath}`;
  }

  private static displayGeneratingThumbnailImage(thumbnailElement: HTMLImageElement, photo: Photo) {
    thumbnailElement.style.width = 'auto';
    thumbnailElement.style.height = 'auto';
    thumbnailElement.style.setProperty('max-width' , '80%', 'important');  //!important to override CSS from Leaflet
    thumbnailElement.style.setProperty('max-height', '80%', 'important');  //!important to override CSS from Leaflet
    thumbnailElement.src = IconDataUrl.generatingThumbnail;
  }

  private static displayNoThumbnailAvailableImage(thumbnailElement: HTMLImageElement, photo: Photo) {
    thumbnailElement.style.width = 'auto';
    thumbnailElement.style.height = 'auto';
    thumbnailElement.style.setProperty('max-width' , '80%', 'important');  //!important to override CSS from Leaflet
    thumbnailElement.style.setProperty('max-height', '80%', 'important');  //!important to override CSS from Leaflet
    thumbnailElement.src = IconDataUrl.noThumbnailAvailable;
  }

  private static handleThumbnailClick(photo: Photo): void {
    logger.info(`Clicked the thumbnail of ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Thumbnail');
    PhotoViewerLauncher.launch(photo);
  }

  private static configureThumbnailToFitWithinContainer(thumbnailElement: HTMLImageElement) {
    thumbnailElement.style.width = 'auto';
    thumbnailElement.style.height = 'auto';
    thumbnailElement.style.setProperty('max-width' , '100%', 'important');  //!important to override CSS from Leaflet
    thumbnailElement.style.setProperty('max-height', '100%', 'important');  //!important to override CSS from Leaflet
  }

  private static thumbnailContainerWidthHeight = '200px';

  private static createThumbnailContainerElement(thumbnailElement: HTMLImageElement) {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'photo-info-viewer-thumbnail-container';
    thumbnailContainer.style.width = this.thumbnailContainerWidthHeight;
    thumbnailContainer.style.height = this.thumbnailContainerWidthHeight;
    thumbnailContainer.appendChild(thumbnailElement);
    return thumbnailContainer;
  }
}
