import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { FilenameExtension } from '../../../src-shared/filename-extension/filename-extension';
import { t } from '../../../src-shared/i18n/i18n';
import { Logger } from '../../../src-shared/log/logger';
import { isFilePathTooLongOnWindows, maxFilePathLengthOnWindows } from '../../../src-shared/max-file-path-length-on-windows/max-file-path-length-on-windows';
import { IconDataUrl } from '../../assets/icon-data-url';
import { PhotoViewerLauncher } from '../photo-viewer-launcher/photo-viewer-launcher';
import { Photo } from '../shared/model/photo.model';
import { openWithAssociatedApp } from '../shared/open-with-os';
import { OpenedDirectory } from '../shared/opened-directory';
import { removeFocus } from '../shared/remove-focus';
import { GeneratedThumbnailService } from './generated-thumbnail.service';
import { MoreOptionsMenuComponent } from './more-options-menu/more-options-menu.component';
import { MoreOptionsMenuPlacement, placeMenu, roomAround } from './more-options-menu/more-options-menu-placement';
import { photoInfoViewerLogger as logger } from './photo-info-viewer-logger';
import { PhotoInfoViewerPlace } from './photo-info-viewer-place';
import { ThumbnailRotationService } from './thumbnail-rotation.service';
import { LoggedLine, logged } from '../../../src-shared/log/logged-line';

/** What the img element of a thumbnail shows. */
interface Thumbnail {
  /** An image of the photo; or what stands in for one that is being made, or for one that cannot be made. */
  readonly kind: 'image' | 'generating' | 'unavailable';
  readonly src: string;
  /** Shown in place of an image that cannot be loaded: why, for a file whose path is too long for Windows. */
  readonly alt: string | null;
  /** What the log says about such a file. */
  readonly warning: LoggedLine | null;
}

const generatingThumbnail: Thumbnail = { kind: 'generating', src: IconDataUrl.generatingThumbnail, alt: null, warning: null };
const unavailableThumbnail: Thumbnail = { kind: 'unavailable', src: IconDataUrl.noThumbnailAvailable, alt: null, warning: null };

/** How long the class that fades a new thumbnail in stays: 2000 ms of its animation, and 500 ms for a late start. */
const fadeInAfterGenerationMs = 2500;

/** The icons of the buttons, by what each button does. */
const buttonIcons = {
  rotate: IconDataUrl.rotate,
  openFile: IconDataUrl.launchExternalApp,
  livePhotos: IconDataUrl.play,
  moreOptions: IconDataUrl.moreOptions,
} as const;

/**
 * The texts of the viewer, which are the same for every photo: the buttons' tooltips, and what is said of a photo
 * that cannot be shown. Read once, as the language does not change while the application runs
 * (src-shared/i18n/i18n.ts), rather than with the `t` pipe, which would be an object of its own for each use in
 * each viewer.
 */
const viewerTexts = {
  rotate: t('photoInfo.rotateThumbnail'),
  openFile: t('photoInfo.openFile'),
  livePhotos: t('photoInfo.livePhotos'),
  moreOptions: t('photoInfo.moreOptions'),
  unavailable: t('photoInfo.unavailable'),
} as const;

/** The address of a file for an img element. */
function fileUrl(filePath: string): string {
  // # needs to be escaped. See https://www.w3schools.com/tags/ref_urlencode.asp for encoding.
  return `file://${filePath.replace(/#/g, '%23')}`;
}

/** The thumbnail that the camera wrote into the photo's EXIF data. */
function thumbnailOfExif(photo: Photo): Thumbnail {
  return { kind: 'image', src: photo.exif.thumbnail.objectUrl, alt: null, warning: null };
}

/** The photo itself as its thumbnail, which the page can show for a JPEG or PNG file. */
function thumbnailOfPhotoItself(photo: Photo): Thumbnail {
  if (!isFilePathTooLongOnWindows(photo.path))
    return { kind: 'image', src: fileUrl(photo.path), alt: null, warning: null };

  return {
    kind: 'image',
    src: fileUrl(photo.path),
    alt: t('photoInfo.pathTooLong', { length: photo.path.length, maximum: maxFilePathLengthOnWindows }),
    warning: logged`
Thumbnail of ${photo.name} cannot be displayed because the length of the file path exceeds the maximum.
Please change the location of ${photo.name} to shorten the path.
-------------------------------
Maximum file path length: ${maxFilePathLengthOnWindows}
File path length of ${photo.name}: ${photo.path.length}
-------------------------------
File path of ${photo.name} is "${photo.path}"
`,
  };
}

/** The thumbnail that the main process made of a photo, in its cache. */
function thumbnailOfGeneratedFile(photo: Photo, thumbnailFilePath: string): Thumbnail {
  if (!isFilePathTooLongOnWindows(thumbnailFilePath))
    return { kind: 'image', src: fileUrl(thumbnailFilePath), alt: null, warning: null };

  return {
    kind: 'image',
    src: fileUrl(thumbnailFilePath),
    alt: t('photoInfo.generatedThumbnailPathTooLong', { length: thumbnailFilePath.length, maximum: maxFilePathLengthOnWindows }),
    warning: logged`
Thumbnail of ${photo.name} cannot be displayed because the length of the file path of the generated thumbnail exceeds the maximum.
Please change the location of ${photo.name} to shorten the path of the generated thumbnail.
-------------------------------
Maximum file path length: ${maxFilePathLengthOnWindows}
File path length of ${photo.name}: ${photo.path.length}
File path length of generated thumbnail: ${thumbnailFilePath.length}
-------------------------------
File path of ${photo.name} is "${photo.path}"
-------------------------------
File path of generated thumbnail is "${thumbnailFilePath}"
`,
  };
}

/**
 * A photo's information: its thumbnail, name and shooting time, with the buttons that turn the thumbnail, open the
 * file, play its Live Photos movie and open the menu of what else can be done with it.
 * TL;DR: One component for the three places that show a photo. Each has its own layout, which the styles give by
 * the place, and shows only the parts that it has room for.
 * Details:
 * - A row of the folder tree has the thumbnail and the shooting time, with the buttons in a column that shows while
 *   the pointer is over the row. A popup of the map has everything. A tile of a cluster's popup has the thumbnail,
 *   small, with a small button that turns it, and the shooting time on two lines; a click on it chooses the tile
 *   rather than opening the file.
 * - The template is used in the tree and in the cluster's popup. Leaflet makes a marker's popup itself, so the map
 *   makes that popup's component outside any template (src/app/map/leaflet-map/leaflet-content.service.ts).
 * - Nothing that has to last is kept here: how far the thumbnail is turned is in ThumbnailRotationService, and
 *   whether a thumbnail has been made in GeneratedThumbnailService. A component is made when its place shows the
 *   photo and destroyed when it no longer does, as when a folder of the tree is collapsed, so that a large folder
 *   costs no more than what is shown of it.
 * - Kept light: there is a component for every photo shown, thousands for a folder that has its photos in it, as
 *   each has a row in the tree. What the template shows is read through methods rather than computed values, which
 *   Angular follows in the same way, while a computed value is an object of its own in each component. The texts
 *   are read once for all the components, and the buttons have no listener that nothing needs.
 * - Each element keeps the class that it had when this content was built with DOM calls, which the end-to-end
 *   tests find the elements by.
 */
@Component({
  selector: 'app-photo-info-viewer',
  templateUrl: './photo-info-viewer.component.html',
  styleUrl: './photo-info-viewer.component.scss',
  imports: [MoreOptionsMenuComponent],
  host: {
    '[attr.data-place]': 'place()',
  },
})
export class PhotoInfoViewerComponent {
  private readonly generatedThumbnailService = inject(GeneratedThumbnailService);
  private readonly thumbnailRotationService = inject(ThumbnailRotationService);

  public readonly photo = input.required<Photo>();
  public readonly place = input.required<PhotoInfoViewerPlace>();

  protected readonly icons = buttonIcons;
  protected readonly texts = viewerTexts;

  /** Whether the thumbnail has just been made while this showed that it was being made, and fades in. */
  protected readonly fadesInAfterGeneration = signal(false);

  /** Where the More Options menu is, while it is open. */
  protected readonly menuPlacement = signal<MoreOptionsMenuPlacement | null>(null);

  /** The movie of a photo's Live Photos, for livePhotosFilePath(). */
  private livePhotos: { photo: Photo; filePath: string | null } | undefined;

  constructor() {
    let fadeInTimer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(fadeInTimer));
    /** The photo whose thumbnail was being made when this last looked. */
    let photoPathOfGeneratingThumbnail: string | undefined;

    // What follows from the photo and its thumbnail, apart from what the template shows.
    effect(() => {
      const photo = this.photo();
      if (!photo?.path) {
        Logger.error(logged`[PhotoInfoViewerComponent] photo.path is not available. photo: ${photo}, photo?.name: ${photo?.name}`, photo);
        return;
      }

      const thumbnail = this.thumbnail();
      if (thumbnail.warning)
        logger.warn(thumbnail.warning);

      if (thumbnail.kind === 'generating') {
        photoPathOfGeneratingThumbnail = photo.path;
        this.generatedThumbnailService.watch(photo.path);
        return;
      }

      // The class is applied and removed, so that the thumbnail fades in just once: an animation starts again
      // whenever its element is put back into the page, as a popup's content is.
      if (thumbnail.kind === 'image' && photoPathOfGeneratingThumbnail === photo.path) {
        this.fadesInAfterGeneration.set(true);
        clearTimeout(fadeInTimer);
        fadeInTimer = setTimeout(() => this.fadesInAfterGeneration.set(false), fadeInAfterGenerationMs);
      }
      photoPathOfGeneratingThumbnail = undefined;
    });
  }

  /**
   * The photo's thumbnail: from the EXIF data where it has one, otherwise the photo itself where the page can show
   * it, otherwise the thumbnail that the main process makes, for a HEIF photo.
   */
  protected thumbnail(): Thumbnail {
    const photo = this.photo();
    if (!photo?.path)
      return unavailableThumbnail;
    if (photo.exif?.thumbnail)
      return thumbnailOfExif(photo);
    if (FilenameExtension.isDisplayableInBrowser(photo.filenameExtension))
      return thumbnailOfPhotoItself(photo);
    if (FilenameExtension.isThumbnailGenerationAvailable(photo.filenameExtension)) {
      const thumbnailFilePath = this.generatedThumbnailService.filePathOf(photo.path);
      return thumbnailFilePath === undefined ? generatingThumbnail : thumbnailOfGeneratedFile(photo, thumbnailFilePath);
    }
    return unavailableThumbnail;
  }

  /** The thumbnail as it is turned: by a quarter more for each click, so that it always turns clockwise. */
  protected thumbnailTransform(): string | null {
    const degrees = this.thumbnailRotationService.degreesOf(this.place(), this.photo().path);
    return degrees === 0 ? null : `rotate(${degrees}deg)`;
  }

  protected dateTimeTaken(): string {
    return this.photo().exif?.dateTimeOriginal?.toDateTimeString({ dayOfWeek: true }) || '';
  }

  protected dateTaken(): string {
    return this.photo().exif?.dateTimeOriginal?.toDateString({ dayOfWeek: true }) || '';
  }

  protected timeTaken(): string {
    return this.photo().exif?.dateTimeOriginal?.toTimeString() || '';
  }

  /**
   * The movie of the photo's Live Photos, or null when it has none. Looked up once for a photo: the movies are those
   * of the folder that was read last, which is not the photo's own while another folder is being opened.
   */
  protected livePhotosFilePath(): string | null {
    const photo = this.photo();
    if (this.livePhotos?.photo !== photo) {
      const { livePhotosAvailable, livePhotosFilePath } = OpenedDirectory.getLivePhotosFilePathIfAvailable(photo.path);
      this.livePhotos = { photo, filePath: livePhotosAvailable ? livePhotosFilePath : null };
    }
    return this.livePhotos.filePath;
  }

  protected onThumbnailClick(): void {
    // In a tile, the click chooses the tile, which the cluster's viewer handles.
    if (this.place() === 'leaflet-map-tile')
      return;

    const photo = this.photo();
    logger.info(`Clicked the thumbnail of ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Thumbnail');
    PhotoViewerLauncher.launch(photo);
  }

  protected onRotateButtonClick(event: MouseEvent): void {
    this.keepToButton(event);
    const photo = this.photo();
    logger.info(`Clicked the rotate button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Rotate Button');
    this.thumbnailRotationService.rotate(this.place(), photo.path);
  }

  protected onOpenFileButtonClick(event: MouseEvent): void {
    this.keepToButton(event);
    const photo = this.photo();
    logger.info(`Clicked the launch photo viewer button for ${photo.path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Launch Photo Viewer Button');
    PhotoViewerLauncher.launch(photo);
  }

  protected onLivePhotosButtonClick(event: MouseEvent, livePhotosFilePath: string): void {
    this.keepToButton(event);
    logger.info(`Clicked the play live photos button for ${this.photo().path}`);
    Analytics.trackEvent('Photo Info Viewer', '[PIV] Clicked Play Live Photos Button');
    openWithAssociatedApp(livePhotosFilePath);
  }

  /** Opens the menu, or closes it when it is open. */
  protected onMoreOptionsButtonClick(event: MouseEvent): void {
    this.keepToButton(event);
    if (this.menuPlacement()) {
      this.closeMenu();
      removeFocus(); // To restore the button's style
      return;
    }
    this.menuPlacement.set(placeMenu(roomAround(event.currentTarget as HTMLElement)));
  }

  protected closeMenu(): void {
    this.menuPlacement.set(null);
  }

  /**
   * Keeps a click on a button from the elements around the button: a click on a tile chooses the tile, and one on a
   * row of the tree goes to the row's node.
   */
  private keepToButton(event: MouseEvent): void {
    event.stopPropagation();
  }
}
