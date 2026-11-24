import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { MapFullScreenService } from './map-full-screen.service';

/**
 * The icons fullscreen and fullscreen_exit of Material Icons (Apache License 2.0), drawn in the template rather than
 * with mat-icon, whose font is downloaded (src/index.html), so that the button shows offline too.
 */
const enterIconPath = 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z';
const exitIconPath = 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z';

/**
 * The button that puts the map in full screen, and takes it out (MapFullScreenService). The map makes this component
 * for its control at the top left (map-full-screen-control.ts), which Leaflet makes the element of.
 */
@Component({
  selector: 'app-leaflet-map-full-screen-button',
  template: `
    @let on = service.on();
    @let label = (on ? 'map.exitFullScreen' : 'map.fullScreen') | t;
    <button class="plm-leaflet-map-full-screen-button" type="button" [title]="label" [attr.aria-label]="label" (click)="toggle()">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="on ? exitIconPath : enterIconPath"/></svg>
    </button>
  `,
  styleUrl: './map-full-screen-button.component.scss',
  imports: [TranslatePipe],
})
export class MapFullScreenButtonComponent {
  protected readonly service = inject(MapFullScreenService);
  protected readonly enterIconPath = enterIconPath;
  protected readonly exitIconPath = exitIconPath;

  protected toggle(): void {
    this.service.toggle('button');
  }
}
