import { afterRenderEffect, Component, computed, ElementRef, input, linkedSignal, untracked, viewChild, viewChildren } from '@angular/core';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
import { NearViewDirective } from '../shared/near-view/near-view.directive';
import { Photo } from '../shared/model/photo.model';

/** The photos in the order of their shooting times, then those without one by their names. */
export function sortByShootingTime(photos: readonly Photo[]): Photo[] {
  const dateAvailablePhotos = photos.filter(photo => !!photo?.exif?.dateTimeOriginal?.moment);
  const dateUnavailablePhotos = photos.filter(photo => !photo?.exif?.dateTimeOriginal?.moment);
  dateAvailablePhotos.sort((a, b) => a.exif.dateTimeOriginal.moment.diff(b.exif.dateTimeOriginal.moment));
  dateUnavailablePhotos.sort((a, b) => a?.name?.localeCompare?.(b?.name));
  return [...dateAvailablePhotos, ...dateUnavailablePhotos];
}

/**
 * The photos of a cluster of the map that cannot be split, as they were taken at one place: a tile for each photo,
 * and the information of the photo whose tile is chosen, the first one at first, or the one that the map reveals.
 * The map makes this component for the cluster's popup (src/app/map/leaflet-map/leaflet-content.service.ts), and
 * keeps it for the popup to show again.
 */
@Component({
  selector: 'app-photo-cluster-viewer',
  template: `
    <div #tiles class="photo-cluster-viewer-left-pane">
      @for (photo of sortedPhotos(); track photo.path) {
        <!-- appNearView: a tile has its photo's thumbnail made once it comes near what the tiles show. -->
        <app-photo-info-viewer #tile
                               appNearView
                               class="photo-cluster-viewer-tile"
                               place="leaflet-map-tile"
                               [class.selected-tile]="photo === selectedPhoto()"
                               [photo]="photo"
                               (click)="selectedPhoto.set(photo)" />
      }
    </div>
    <div class="photo-cluster-viewer-right-pane">
      <!--
        A component of its own for each photo: one that went on to show another photo would turn its thumbnail from
        how far the previous photo's was turned, and show the previous image until the next one is loaded.
      -->
      @for (photo of [selectedPhoto()]; track photo?.path) {
        <app-photo-info-viewer place="leaflet-map-popup" [photo]="photo" />
      }
    </div>
  `,
  styleUrl: './photo-cluster-viewer.component.scss',
  imports: [PhotoInfoViewerComponent, NearViewDirective],
  host: {
    'class': 'photo-cluster-viewer-root',
  },
})
export class PhotoClusterViewerComponent {
  public readonly photos = input.required<readonly Photo[]>();
  /** The photo whose tile is chosen when the viewer gets its photos, as the map gives for a photo that it reveals. */
  public readonly chosenPhoto = input<Photo | null>(null);

  protected readonly sortedPhotos = computed(() => sortByShootingTime(this.photos()));
  /** The photo whose tile is chosen: the one given, or the first one, whenever the viewer gets its photos. */
  protected readonly selectedPhoto = linkedSignal(() => {
    const sortedPhotos = this.sortedPhotos();
    const chosenPhotoPath = this.chosenPhoto()?.path;
    return sortedPhotos.find(photo => photo.path === chosenPhotoPath) ?? sortedPhotos[0];
  });
  private readonly tiles = viewChild.required<ElementRef<HTMLElement>>('tiles');
  private readonly tileElements = viewChildren('tile', { read: ElementRef });

  constructor() {
    // The map gives the viewer its photos again when the cluster's popup is opened again: the viewer then starts
    // over, with the tiles scrolled back to their top, or to the middle of the tile that is chosen, when it is
    // further down than the tiles show. The scroll is an object of its own each time, as the write phase runs only
    // when what the read phase gives it changes.
    afterRenderEffect({
      earlyRead: () => {
        this.photos();
        this.chosenPhoto();
        const index = this.sortedPhotos().indexOf(untracked(this.selectedPhoto));
        const tile: HTMLElement | undefined = this.tileElements()[index]?.nativeElement;
        const tiles = this.tiles().nativeElement;
        if (!tile || index === 0)
          return { scrollTop: 0 };
        const tileTop = tile.getBoundingClientRect().top - tiles.getBoundingClientRect().top + tiles.scrollTop;
        const tileBottom = tileTop + tile.offsetHeight;
        return { scrollTop: tileBottom <= tiles.clientHeight ? 0 : tileTop - (tiles.clientHeight - tile.offsetHeight) / 2 };
      },
      write: scroll => {
        this.tiles().nativeElement.scrollTop = scroll().scrollTop;
      },
    });
  }
}
