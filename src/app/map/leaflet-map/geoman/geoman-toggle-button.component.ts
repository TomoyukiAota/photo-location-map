import { Component, input, WritableSignal } from '@angular/core';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-leaflet-map-geoman-toggle-button',
  template: `
    @let label = 'photoInfo.moreOptions' | t;
    <button type="button" class="plm-leaflet-map-geoman-toggle-button" [title]="label" [attr.aria-label]="label"
            [attr.aria-expanded]="expansion()()" (click)="toggle()">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5" cy="12" r="2"/>
        <circle cx="12" cy="12" r="2"/>
        <circle cx="19" cy="12" r="2"/>
      </svg>
    </button>
  `,
  styleUrl: './geoman-toggle-button.component.scss',
  imports: [TranslatePipe],
})
export class GeomanToggleButtonComponent {
  public readonly expansion = input.required<WritableSignal<boolean>>();

  protected toggle(): void {
    this.expansion().update(expanded => !expanded);
  }
}
