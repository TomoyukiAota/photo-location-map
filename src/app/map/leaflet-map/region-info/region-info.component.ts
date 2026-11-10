import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

/**
 * What the map says about the regions drawn on it: how many of the photos on the map are within them, and a button
 * that selects those photos. The map makes this component for its control at the bottom
 * (../leaflet-content.service.ts), which Leaflet makes the element of.
 */
@Component({
  selector: 'app-leaflet-map-region-info',
  template: `
    <div class="plm-leaflet-map-region-info-text">{{ 'map.photosInRegions' | t: { count: photoCount() } }}</div>
    <button class="plm-leaflet-map-region-info-select-photos-button"
            type="button"
            [disabled]="photoCount() === 0"
            (click)="selectPhotos.emit()">{{ 'map.selectPhotos' | t }}</button>
  `,
  styleUrl: './region-info.component.scss',
  imports: [TranslatePipe],
  host: {
    'class': 'plm-leaflet-map-region-info-container',
  },
})
export class RegionInfoComponent {
  /** The number of photos within the regions. */
  public readonly photoCount = input.required<number>();
  /** The button was clicked. */
  public readonly selectPhotos = output<void>();
}
