import * as fs from 'fs';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { Logger } from '../../../src-shared/log/logger';
import { IconDataUrl } from '../../assets/icon-data-url';
import { Dimensions } from '../shared/model/dimensions.model';
import { Photo } from '../shared/model/photo.model';
import { PhotoViewerLauncher } from '../photo-viewer/photo-viewer-launcher';
import { OpenContainingFolderIconElement } from './open-containing-folder-icon-element';
import { RotateIconElement } from './rotate-icon-element';
import { LaunchPhotoViewerIconElement } from './launch-photo-viewer-icon-element';
import { PlayLivePhotosIconElement } from './play-live-photos-icon-element';
import { getThumbnailFilePath } from '../../../src-shared/thumbnail/get-thumbnail-file-path';

export class PhotoInfoViewerContent {
  public static generate(photo: Photo) {
    const rootDivElement = document.createElement('div');
    rootDivElement.style.textAlign = 'center';

    if (photo) {
      this.appendToRootDivElement(rootDivElement, photo);
    } else {
      rootDivElement.innerText = 'Photo information is unavailable.';
    }

    return rootDivElement;
  }

  private static appendToRootDivElement(rootDivElement, photo: Photo) {
    const thumbnailElement = this.createThumbnailElement(photo);
    const thumbnailContainerElement = this.createThumbnailContainerElement(photo, thumbnailElement);
    const nameElement = this.createNameElement(photo);
    const dateTakenElement = this.createDateTimeTakenElement(photo);

    [thumbnailContainerElement, nameElement, dateTakenElement]
      .forEach(element => rootDivElement.appendChild(element));

    this.appendRotateIconElement(rootDivElement, thumbnailElement, photo);
    this.appendOpenContainingFolderIconElement(rootDivElement, photo);
    this.appendLaunchPhotoViewerIconElement(rootDivElement, photo);
    this.appendPlayLivePhotosIconElement(rootDivElement, photo);
  }

  private static createThumbnailElement(photo: Photo) {
    const thumbnailElement = document.createElement('img');

    const isThumbnailAvailableFromExif = photo.exif.thumbnail;
    const isPhotoDisplayableInBrowser = FilenameExtension.isDisplayableInBrowser(photo.filenameExtension);
    const isThumbnailGenerationAvailable = FilenameExtension.isThumbnailGenerationAvailable(photo.filenameExtension);

    if (isThumbnailAvailableFromExif) {
      this.displayThumbnailFromExif(thumbnailElement, photo);
    } else if (isPhotoDisplayableInBrowser) {
      this.displayThumbnailUsingPhotoItself(thumbnailElement, photo);
    } else if (isThumbnailGenerationAvailable) {
      this.displayGeneratedThumbnail(thumbnailElement, photo);
    } else {
      this.displayNoThumbnailAvailableImage(thumbnailElement, photo);
    }

    thumbnailElement.style.transition = 'transform 0.3s ease-in-out';
    thumbnailElement.onclick = () => this.handleThumbnailClick(photo);
    return thumbnailElement;
  }

  private static displayThumbnailFromExif(thumbnailElement: HTMLImageElement, photo: Photo) {
    thumbnailElement.src = photo.exif.thumbnail.dataUrl;
    thumbnailElement.width = photo.exif.thumbnail.dimensions.width;
    thumbnailElement.height = photo.exif.thumbnail.dimensions.height;
    thumbnailElement.title = `Click the thumbnail to open ${photo.name}`;
  }

  private static displayThumbnailUsingPhotoItself(thumbnailElement: HTMLImageElement, photo: Photo) {
    this.displayThumbnailUsingFile(thumbnailElement, photo, photo.path);
  }

  private static displayGeneratedThumbnail(thumbnailElement: HTMLImageElement, photo: Photo) {
    const intervalId = setInterval(() => {
      const { thumbnailFilePath } = getThumbnailFilePath(photo.path);
      const thumbnailFileExists = fs.existsSync(thumbnailFilePath);
      if (thumbnailFileExists) {
        this.displayThumbnailUsingFile(thumbnailElement, photo, thumbnailFilePath);
        clearInterval(intervalId);
      } else {
        this.displayGeneratingThumbnailImage(thumbnailElement, photo);
      }
    }, 1000);
  }

  // Minimum length of a side of a square for a thumbnail container.
  private static minThumbnailContainerWidthHeight = 200;

  private static displayThumbnailUsingFile(thumbnailElement: HTMLImageElement, photo: Photo, thumbnailFilePath: string) {
    // # needs to be escaped. See https://www.w3schools.com/tags/ref_urlencode.asp for encoding.
    const escapedPath = thumbnailFilePath.replace(/#/g, '%23');
    thumbnailElement.src = `file://${escapedPath}`;
    const largerSideLength = this.minThumbnailContainerWidthHeight;
    if (photo.exif.imageDimensions.width > photo.exif.imageDimensions.height) {
      thumbnailElement.width = largerSideLength;
      thumbnailElement.height = largerSideLength * (photo.exif.imageDimensions.height / photo.exif.imageDimensions.width);
    } else {
      thumbnailElement.width = largerSideLength * (photo.exif.imageDimensions.width / photo.exif.imageDimensions.height);
      thumbnailElement.height = largerSideLength;
    }
    thumbnailElement.title = `Click the thumbnail to open ${photo.name}`;
  }

  private static displayGeneratingThumbnailImage(thumbnailElement: HTMLImageElement, photo: Photo) {
    thumbnailElement.width = 150;
    thumbnailElement.height = 15;
    thumbnailElement.src = IconDataUrl.generatingThumbnail;
    thumbnailElement.title = `Generating thumbnail for ${photo.name}.`;
  }

  private static displayNoThumbnailAvailableImage(thumbnailElement: HTMLImageElement, photo: Photo) {
    thumbnailElement.width = 150;
    thumbnailElement.height = 15;
    thumbnailElement.src = IconDataUrl.noThumbnailAvailable;
    thumbnailElement.title = `Thumbnail is not available for ${photo.name}.`;
  }

  private static handleThumbnailClick(photo: Photo): void {
    Logger.info(`Photo Info Viewer: Clicked the thumbnail of ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', 'Clicked Thumbnail');
    PhotoViewerLauncher.launch(photo);
  }

  private static createThumbnailContainerElement(photo: Photo, thumbnailElement: HTMLImageElement) {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.style.display = 'flex';
    thumbnailContainer.style.justifyContent = 'center';
    thumbnailContainer.style.alignItems = 'center';
    const thumbnailContainerDimensions = new Dimensions(thumbnailElement.width, thumbnailElement.height).expandToSquare();
    thumbnailContainer.style.width = thumbnailContainerDimensions.width.toString() + 'px';
    thumbnailContainer.style.minWidth = `${this.minThumbnailContainerWidthHeight}px`;
    thumbnailContainer.style.height = thumbnailContainerDimensions.height.toString() + 'px';
    thumbnailContainer.style.minHeight = `${this.minThumbnailContainerWidthHeight}px`;

    thumbnailContainer.appendChild(thumbnailElement);
    return thumbnailContainer;
  }

  private static createNameElement(photo: Photo) {
    const nameElement = document.createElement('div');
    nameElement.innerText = photo.name;
    nameElement.style.fontSize = '14px';
    nameElement.style.fontWeight = 'bold';
    return nameElement;
  }

  private static createDateTimeTakenElement(photo: Photo) {
    const dateTimeTaken = photo?.exif?.dateTimeOriginal?.displayString();
    const dateTakenElement = document.createElement('div');
    dateTakenElement.innerText = dateTimeTaken || 'Date taken is not available.';
    dateTakenElement.style.fontSize = '14px';
    dateTakenElement.style.fontWeight = 'bold';
    return dateTakenElement;
  }

  private static appendRotateIconElement(rootDivElement: HTMLDivElement, thumbnailElement: HTMLImageElement | Text, photo: Photo): void {
    if (thumbnailElement instanceof Text)
      return;

    const rotateIconElement = RotateIconElement.create(thumbnailElement, photo);
    rootDivElement.appendChild(rotateIconElement);
  }

  private static appendOpenContainingFolderIconElement(rootDivElement: HTMLDivElement, photo: Photo): void {
    const element = OpenContainingFolderIconElement.create(photo);
    rootDivElement.appendChild(element);
  }

  private static appendLaunchPhotoViewerIconElement(rootDivElement: HTMLDivElement, photo: Photo): void {
    const element = LaunchPhotoViewerIconElement.create(photo);
    rootDivElement.appendChild(element);
  }

  private static appendPlayLivePhotosIconElement(rootDivElement: HTMLDivElement, photo: Photo) {
    const element = PlayLivePhotosIconElement.create(photo);
    if (element) {
      rootDivElement.appendChild(element);
    }
  }
}
