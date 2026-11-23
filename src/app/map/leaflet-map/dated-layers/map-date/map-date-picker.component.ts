import { afterNextRender, Component, computed, effect, ElementRef, input, OnDestroy, output, untracked, viewChild } from '@angular/core';
import moment from 'moment';
import type { Datepicker, DatepickerEventDetail } from 'vanillajs-datepicker';
import { DateTimeFormat } from '../../../../../../src-shared/date-time/date-time-format';
import { currentLanguage } from '../../../../../../src-shared/i18n/i18n';
import { getLanguage } from '../../../../../../src-shared/i18n/languages';
import { currentUserSettings } from '../../../../../../src-shared/user-settings/user-settings';
import { loadDatepickerLocale } from '../../../../shared/i18n/datepicker-locales';

/** The datepicker's format of a date, for the user's date format: its tokens are moment's, in lower case. */
export function datepickerFormatOf(dateFormat: DateTimeFormat.ForUser.DateFormatType): string {
  return dateFormat.toLowerCase();
}

/**
 * The date of the map as a field that opens a calendar, vanillajs-datepicker's, to choose another date from.
 * TL;DR: The field shows the date in the user's date format, and the calendar is in the application's language.
 * Details:
 * - The datepicker and its locale are loaded when the field is first made, as the field is there only while
 *   OpenHistoricalMap is the map's base layer. The field shows the date before that too, and the datepicker reads it.
 * - The calendar is put in the page's body, not next to the field, which the datepicker does by default: the field is
 *   in a control of the map, whose container hides what goes beyond the map, and a calendar of about 250 pixels in
 *   height would be cut in a short map. Its style is with the map's (src/styles/plm-leaflet-map/).
 * - The datepicker tells of a date set from here, such as the photos' date, as of one chosen in it (changeDate), so
 *   the dates set from here are told apart.
 * - The calendar closes at a press of the mouse anywhere but in it and the field, in a control of the map too
 *   (closeOnPressElsewhere).
 */
@Component({
  selector: 'app-leaflet-map-date-picker',
  template: `<input #field class="plm-leaflet-map-date-picker-field" type="text" autocomplete="off" spellcheck="false"
                    [value]="text()" [attr.aria-label]="label()" (changeDate)="onChangeDate($event)">`,
  styleUrl: './map-date-picker.component.scss',
})
export class MapDatePickerComponent implements OnDestroy {
  /** The date shown, YYYY-MM-DD. */
  public readonly date = input.required<string>();
  /** The field's name, for a screen reader. */
  public readonly label = input.required<string>();
  /** A date was chosen in the calendar or typed in the field, YYYY-MM-DD. */
  public readonly pick = output<string>();

  /** The date in the user's date format. */
  protected readonly text = computed(() => moment(this.date(), 'YYYY-MM-DD').format(currentUserSettings.dateFormat));
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private datepicker: Datepicker | null = null;
  /** Whether the datepicker is being given the date from here, which it tells of as a change. */
  private settingDate = false;
  private destroyed = false;

  constructor() {
    afterNextRender(() => this.createDatepicker());
    effect(() => {
      const date = this.date();
      untracked(() => this.show(date));
    });
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
    document.removeEventListener('mousedown', this.closeOnPressElsewhere, { capture: true });
    this.datepicker?.destroy();
    this.datepicker = null;
  }

  private async createDatepicker(): Promise<void> {
    const { Datepicker } = await import('vanillajs-datepicker');
    const language = getLanguage(currentLanguage).datepickerLocale;
    await loadDatepickerLocale(Datepicker, language);
    if (this.destroyed)
      return;
    this.datepicker = new Datepicker(this.field().nativeElement, {
      container: document.body,
      language,
      format: datepickerFormatOf(currentUserSettings.dateFormat),
      maxDate: new Date(),
      autohide: true,
      todayHighlight: true,
    });
    document.addEventListener('mousedown', this.closeOnPressElsewhere, { capture: true });
    this.show(this.date());
  }

  /**
   * Closes the calendar at a press of the mouse anywhere but in it and the field, as the datepicker does at a press
   * that reaches the document (onClickOutside, in its js/events/otherListeners.js).
   * TL;DR: Leaflet keeps a press in a control of the map, such as the box of this field, from reaching the document, so
   * that the map is not dragged. This hears the press on its way down to the control, before Leaflet stops it.
   * Details:
   * - Once the field has lost the focus, which the press takes from it, the field's text is taken as the date, or the
   *   date replaces it when it is not one, as the datepicker's updateOnBlur does, and the calendar closes. This is also
   *   done when the field has the focus while its calendar is hidden, as after Escape.
   * - A press that reaches the document is heard by the datepicker too, which then finds nothing left to do.
   */
  private readonly closeOnPressElsewhere = (event: MouseEvent): void => {
    const datepicker = this.datepicker;
    const field = this.field().nativeElement;
    const fieldFocused = document.activeElement === field;
    if (!datepicker || (!datepicker.active && !fieldFocused))
      return;
    const path = event.composedPath();
    if (path.includes(field) || path.includes(datepicker.pickerElement))
      return;
    const close = () => {
      if (this.datepicker !== datepicker)
        return; // Destroyed with the component.
      datepicker.update({ revert: true });
      datepicker.hide();
    };
    if (fieldFocused)
      field.addEventListener('blur', close, { once: true });
    else
      close();
  };

  /** Makes the date, YYYY-MM-DD, the calendar's choice, once the datepicker is there. */
  private show(date: string): void {
    if (!this.datepicker)
      return;
    this.settingDate = true;
    try {
      this.datepicker.setDate(moment(date, 'YYYY-MM-DD').toDate(), { clear: true, render: true, autohide: false });
    } finally {
      this.settingDate = false;
    }
  }

  protected onChangeDate(event: Event): void {
    const detail = (event as CustomEvent<DatepickerEventDetail>).detail;
    if (this.settingDate)
      return;
    // Emptied, as by deleting the field's text: the date shown stays.
    if (!detail.date) {
      this.show(this.date());
      return;
    }
    this.pick.emit(moment(detail.date).format('YYYY-MM-DD'));
  }
}
