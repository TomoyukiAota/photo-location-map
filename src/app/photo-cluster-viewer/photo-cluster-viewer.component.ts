import { afterRenderEffect, Component, computed, ElementRef, input, linkedSignal, viewChild } from '@angular/core';
import { PhotoInfoViewerComponent } from '../photo-info-viewer/photo-info-viewer.component';
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
 * and the information of the photo whose tile is chosen, the first one at first.
 * The map makes this component for the cluster's popup (src/app/map/leaflet-map/leaflet-content.service.ts), and
 * keeps it for the popup to show again.
 */
@Component({
  selector: 'app-photo-cluster-viewer',
  template: `
    <div #tiles class="photo-cluster-viewer-left-pane">
      @for (photo of sortedPhotos(); track photo.path) {
        <app-photo-info-viewer class="photo-cluster-viewer-tile"
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
  imports: [PhotoInfoViewerComponent],
  host: {
    'class': 'photo-cluster-viewer-root',
  },
})
export class PhotoClusterViewerComponent {
  public readonly photos = input.required<readonly Photo[]>();

  protected readonly sortedPhotos = computed(() => sortByShootingTime(this.photos()));
  /** The photo whose tile is chosen: the first one whenever the viewer gets its photos. */
  protected readonly selectedPhoto = linkedSignal(() => this.sortedPhotos()[0]);
  private readonly tiles = viewChild.required<ElementRef<HTMLElement>>('tiles');

  constructor() {
    // The map gives the viewer its photos again when the cluster's popup is opened again: the viewer then starts
    // over, with the first tile chosen and the tiles scrolled back to it.
    afterRenderEffect({
      write: () => {
        this.photos();
        this.tiles().nativeElement.scrollTop = 0;
      },
    });
  }
}
