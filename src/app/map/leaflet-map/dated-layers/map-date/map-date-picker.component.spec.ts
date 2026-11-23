import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTimeFormat } from '../../../../../../src-shared/date-time/date-time-format';
import { datepickerFormatOf, MapDatePickerComponent } from './map-date-picker.component';

describe('MapDatePickerComponent', () => {
  let fixture: ComponentFixture<MapDatePickerComponent>;
  let field: HTMLInputElement;
  let picked: string[];

  /** The calendar, which the datepicker puts in the page's body once it is made. */
  const calendar = () => document.querySelector<HTMLElement>('body > .datepicker');

  async function show(date: string): Promise<void> {
    fixture.componentRef.setInput('date', date);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(MapDatePickerComponent);
    fixture.componentRef.setInput('label', 'Date of the map');
    picked = [];
    fixture.componentInstance.pick.subscribe(date => picked.push(date));
    await show('2025-08-10');
    field = fixture.nativeElement.querySelector('input');
    // The datepicker and its locale are loaded after the field is first rendered. The datepicker marks the field.
    await vi.waitFor(() => expect(field.classList).toContain('datepicker-input'));
    expect(calendar()).not.toBeNull();
  });

  afterEach(() => fixture.destroy());

  it('shows the date in the user\'s date format, and names the field', () => {
    expect(field.value).toBe('2025-08-10');
    expect(field.getAttribute('aria-label')).toBe('Date of the map');
  });

  it('opens its calendar at the date, and tells of a day chosen in it', async () => {
    field.focus();
    field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await vi.waitFor(() => expect(calendar().classList.contains('active')).toBe(true));
    expect(calendar().querySelector('.datepicker-cell.day.selected').textContent).toBe('10');

    const firstOfAugust = [...calendar().querySelectorAll<HTMLElement>('.datepicker-cell.day:not(.prev):not(.next)')]
      .find(cell => cell.textContent === '1');
    firstOfAugust.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(picked).toEqual(['2025-08-01']);
    expect(field.value).toBe('2025-08-01');
  });

  it('closes its calendar at a press elsewhere, even one kept from the page, and takes the date typed', async () => {
    // As Leaflet keeps a press in a control of the map, such as the box of the field, from reaching the document.
    const box = document.createElement('div');
    box.addEventListener('mousedown', event => event.stopPropagation());
    document.body.append(box);
    try {
      field.focus();
      await vi.waitFor(() => expect(calendar().classList.contains('active')).toBe(true));
      field.value = '2019-10-01';

      box.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      // The press takes the focus from the field, as a browser does.
      field.blur();

      expect(calendar().classList.contains('active')).toBe(false);
      expect(picked).toEqual(['2019-10-01']);
    } finally {
      box.remove();
    }
  });

  it('shows a date given to it without telling of it as chosen, and keeps it when its text is deleted', async () => {
    await show('1964-10-10');
    expect(field.value).toBe('1964-10-10');

    field.value = '';
    field.dispatchEvent(new FocusEvent('blur'));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(picked).toEqual([]);
    expect(field.value).toBe('1964-10-10');
  });

  it('removes its calendar with itself', () => {
    fixture.destroy();
    expect(calendar()).toBeNull();
  });
});

describe('datepickerFormatOf', () => {
  it('writes each of the user\'s date formats in the datepicker\'s tokens', () => {
    expect(DateTimeFormat.ForUser.DateFormat_List.map(datepickerFormatOf)).toEqual(['yyyy-mm-dd', 'yyyy/mm/dd', 'dd/mm/yyyy', 'mm/dd/yyyy']);
  });
});
