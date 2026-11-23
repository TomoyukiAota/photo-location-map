import { Component, computed, input, output } from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import moment from 'moment';
import { t } from '../../../../../../src-shared/i18n/i18n';
import { TranslationKey } from '../../../../../../src-shared/i18n/translation-key';
import { momentToDateString } from '../../../../shared/moment-to-string';
import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
import { PhotoDates } from '../photo-dates';
import { MapDatePickerComponent } from './map-date-picker.component';

/** The layers of a past date: Esri World Imagery Wayback, and OpenHistoricalMap. */
export type MapDateKind = 'wayback' | 'openHistoricalMap';

/** What the layer's date is waiting for, or what went wrong. */
export type MapDateStatus = 'ready' | 'loading' | 'failed' | 'zoomIn' | 'mapFailed';

/** A version of Wayback's imagery to choose. */
export interface MapDateChoice {
  /** The number of its release. */
  readonly release: number;
  /** When its imagery was taken at the map's center, YYYY-MM-DD, or null when that is not known. */
  readonly captureDate: string | null;
  /** When its release was published, YYYY-MM-DD, which names imagery without a date. */
  readonly releaseDate: string;
  /** Whether it is one of the two taken nearest to the photos' dates, before and after (photo-dates.ts). */
  readonly nearPhotos: boolean;
}

/** What the control shows. */
export interface MapDateView {
  readonly kind: MapDateKind;
  readonly status: MapDateStatus;
  /** Wayback: the versions at the map's center, newest first, and the release of the one shown. */
  readonly choices: readonly MapDateChoice[];
  readonly chosenRelease: number | null;
  /** The date shown when there is nothing to choose from: the map's date, or the date of Wayback's release. */
  readonly date: string | null;
  readonly photoDates: PhotoDates | null;
  readonly matchPhotoDates: boolean;
  readonly canGoEarlier: boolean;
  readonly canGoLater: boolean;
}

/** A date, YYYY-MM-DD, in the user's date format. */
function formatted(date: string): string {
  return momentToDateString(moment(date, 'YYYY-MM-DD'));
}

/** A part of a sentence: its words, or one of its dates. */
export interface NotePart {
  readonly text: string;
  readonly isDate: boolean;
}

/**
 * The sentence of `key` with these dates, YYYY-MM-DD, in parts, so that each date stays on one line.
 * TL;DR: The sentence is translated with a mark in place of each date, and split at the marks.
 * Details: A browser breaks a line after a hyphen, which broke "2019-03-16" into "2019-" and "03-16". Each language
 * puts the dates where its sentence has them, so the sentence is split where the translation put them; the marks are
 * characters of Unicode's private use area, which no translation has. In a language written from right to left, t()
 * puts each value between U+2068 and U+2069, which stay in the words around the date.
 */
export function withDates(key: TranslationKey, dates: Readonly<Record<string, string>>): NotePart[] {
  const names = Object.keys(dates);
  const marks = Object.fromEntries(names.map((name, index) => [name, String.fromCharCode(0xE000 + index)]));
  const parts: NotePart[] = [];
  let text = '';
  for (const character of t(key, marks)) {
    const index = character.charCodeAt(0) - 0xE000;
    if (index >= 0 && index < names.length) {
      if (text)
        parts.push({ text, isDate: false });
      parts.push({ text: formatted(dates[names[index]]), isDate: true });
      text = '';
    } else {
      text += character;
    }
  }
  if (text)
    parts.push({ text, isDate: false });
  return parts;
}

/**
 * The date of a layer of a past date, on the map: when its imagery was taken, in a list, or the date that its map
 * shows, in a field that opens a calendar (map-date-picker.component.ts), with the buttons to an earlier and a later
 * one, and the choice of matching the dates of the photos on the map. The map makes this component for its control at
 * the top, beside the layers button (../dated-layers.ts, ../../leaflet-content.service.ts).
 */
@Component({
  selector: 'app-leaflet-map-date',
  template: `
    <div class="plm-leaflet-map-date-title">{{ titleKey() | t }}</div>
    <div class="plm-leaflet-map-date-row">
      <button class="plm-leaflet-map-date-step plm-leaflet-map-date-earlier"
              type="button"
              [title]="earlierKey() | t"
              [attr.aria-label]="earlierKey() | t"
              [disabled]="!view().canGoEarlier"
              (click)="earlier.emit()">‹</button>
      @if (view().choices.length > 0) {
        <div class="plm-leaflet-map-date-select">
          <select [attr.aria-label]="titleKey() | t" (change)="onSelectChange($event)">
            @for (choice of view().choices; track choice.release) {
              <option [value]="choice.release" [selected]="choice.release === view().chosenRelease">{{ labelOf(choice) }}</option>
            }
          </select>
        </div>
      } @else if (view().kind === 'openHistoricalMap' && view().date) {
        <app-leaflet-map-date-picker [date]="view().date" [label]="titleKey() | t" (pick)="pick.emit($event)"/>
      } @else {
        <div class="plm-leaflet-map-date-value">{{ dateText() }}</div>
      }
      <button class="plm-leaflet-map-date-step plm-leaflet-map-date-later"
              type="button"
              [title]="laterKey() | t"
              [attr.aria-label]="laterKey() | t"
              [disabled]="!view().canGoLater"
              (click)="later.emit()">›</button>
    </div>
    <mat-checkbox class="plm-leaflet-map-date-match"
                  [checked]="view().matchPhotoDates"
                  (change)="onMatchChange($event)"><span class="plm-leaflet-map-date-match-label">{{ 'map.dates.matchPhotoDates' | t }}</span></mat-checkbox>
    <div class="plm-leaflet-map-date-note" [class.plm-leaflet-map-date-loading]="view().status === 'loading'">
      @if (view().status === 'loading') {
        <mat-spinner class="plm-leaflet-map-date-spinner" aria-hidden="true" [diameter]="14" [strokeWidth]="2"/>
      }
      @for (part of noteParts(); track $index) {<span [class.plm-leaflet-map-date-unbroken]="part.isDate">{{ part.text }}</span>}
    </div>
  `,
  styleUrl: './map-date.component.scss',
  imports: [MatCheckbox, MatProgressSpinner, MapDatePickerComponent, TranslatePipe],
  host: {
    'class': 'plm-leaflet-map-date-container',
  },
})
export class MapDateComponent {
  public readonly view = input.required<MapDateView>();
  /** The button to an earlier date was clicked. */
  public readonly earlier = output<void>();
  /** The button to a later date was clicked. */
  public readonly later = output<void>();
  /** A version of Wayback's imagery was chosen in the list, by its release's number. */
  public readonly choose = output<number>();
  /** A date of OpenHistoricalMap was chosen in the calendar, YYYY-MM-DD. */
  public readonly pick = output<string>();
  /** The choice of matching the photos' dates changed. */
  public readonly matchPhotoDatesChange = output<boolean>();

  protected readonly titleKey = computed<TranslationKey>(() =>
    this.view().kind === 'wayback' ? 'map.dates.imageryDate' : 'map.dates.mapDate');
  protected readonly earlierKey = computed<TranslationKey>(() =>
    this.view().kind === 'wayback' ? 'map.dates.olderImagery' : 'map.dates.yearEarlier');
  protected readonly laterKey = computed<TranslationKey>(() =>
    this.view().kind === 'wayback' ? 'map.dates.newerImagery' : 'map.dates.yearLater');

  protected readonly dateText = computed(() => {
    const date = this.view().date;
    if (!date)
      return '';
    return this.view().kind === 'wayback' ? t('map.dates.versionOf', { date: formatted(date) }) : formatted(date);
  });

  /**
   * The note below the box's choice: what the date waits for or what went wrong, or the dates of the photos, which are
   * not broken across lines. While the dates load, which takes seconds with Esri's servers (../wayback.ts), a spinner
   * goes before the note. A screen reader skips it, as the note says the same.
   */
  protected readonly noteParts = computed<NotePart[]>(() => {
    const view = this.view();
    switch (view.status) {
      case 'loading': return [{ text: t('map.dates.loading'), isDate: false }];
      case 'failed': return [{ text: t('map.dates.failed'), isDate: false }];
      case 'zoomIn': return [{ text: t('map.dates.zoomIn'), isDate: false }];
      case 'mapFailed': return [{ text: t('map.dates.mapFailed'), isDate: false }];
    }
    const dates = view.photoDates;
    if (!dates)
      return [{ text: t('map.dates.noPhotoDates'), isDate: false }];
    return dates.first === dates.last
      ? withDates('map.dates.photosTakenOn', { date: dates.first })
      : withDates('map.dates.photosTakenFromTo', { first: dates.first, last: dates.last });
  });

  protected labelOf(choice: MapDateChoice): string {
    if (choice.captureDate === null)
      return t('map.dates.versionOf', { date: formatted(choice.releaseDate) });
    const date = formatted(choice.captureDate);
    return choice.nearPhotos ? t('map.dates.nearPhotoDates', { date }) : date;
  }

  protected onSelectChange(event: Event): void {
    this.choose.emit(Number((event.target as HTMLSelectElement).value));
  }

  protected onMatchChange(event: MatCheckboxChange): void {
    this.matchPhotoDatesChange.emit(event.checked);
  }
}
