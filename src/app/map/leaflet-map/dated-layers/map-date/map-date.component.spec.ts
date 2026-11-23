import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapDateComponent, MapDateView, withDates } from './map-date.component';

const wayback: MapDateView = {
  status: 'ready',
  choices: [
    { release: 49059, captureDate: '2025-11-27', releaseDate: '2026-04-30', nearPhotos: true },
    { release: 49999, captureDate: '2025-04-21', releaseDate: '2025-07-31', nearPhotos: true },
    { release: 52930, captureDate: '2023-09-10', releaseDate: '2024-05-09', nearPhotos: false },
    { release: 10, captureDate: null, releaseDate: '2014-02-20', nearPhotos: false },
  ],
  chosenRelease: 49999,
  date: null,
  photoDates: { first: '2025-08-10', last: '2025-08-10', middle: '2025-08-10' },
  matchPhotoDates: false,
  canGoEarlier: true,
  canGoLater: true,
};

describe('MapDateComponent', () => {
  let fixture: ComponentFixture<MapDateComponent>;
  let element: HTMLElement;

  const text = (selector: string) => element.querySelector(selector)?.textContent.trim();
  const button = (which: 'earlier' | 'later') => element.querySelector<HTMLButtonElement>(`.plm-leaflet-map-date-${which}`);
  const select = () => element.querySelector<HTMLSelectElement>('select');

  async function show(view: MapDateView): Promise<void> {
    fixture.componentRef.setInput('view', view);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(MapDateComponent);
    element = fixture.nativeElement;
  });

  it('lists the dates of Wayback\'s imagery, marks those near the photos\' dates, and shows the one chosen', async () => {
    await show(wayback);

    expect(element.classList.contains('plm-leaflet-map-date-container')).toBe(true);
    expect(text('.plm-leaflet-map-date-title')).toBe('Imagery date at the map’s center');
    expect([...select().options].map(option => option.textContent)).toEqual([
      '2025-11-27 (near the photos’ dates)', '2025-04-21 (near the photos’ dates)', '2023-09-10', 'Version of 2014-02-20',
    ]);
    expect(select().value).toBe('49999');
    expect(select().getAttribute('aria-label')).toBe('Imagery date at the map’s center');
    expect(button('earlier').title).toBe('Older imagery');
    expect(button('later').title).toBe('Newer imagery');
    expect(element.querySelector<HTMLInputElement>('mat-checkbox input').checked).toBe(false);
    expect(text('.plm-leaflet-map-date-match')).toBe('Match the dates the photos were taken');
    expect(text('.plm-leaflet-map-date-note')).toBe('Photos taken on 2025-08-10');
  });

  it('shows the dates of the photos on the map, and whether the imagery is matched to them', async () => {
    await show({ ...wayback, photoDates: { first: '2025-08-10', last: '2025-08-12', middle: '2025-08-11' }, matchPhotoDates: true });

    expect(element.querySelector<HTMLInputElement>('mat-checkbox input').checked).toBe(true);
    expect(text('.plm-leaflet-map-date-note')).toBe('Photos taken from 2025-08-10 to 2025-08-12');
    // Each date on one line.
    expect([...element.querySelectorAll('.plm-leaflet-map-date-note .plm-leaflet-map-date-unbroken')].map(date => date.textContent))
      .toEqual(['2025-08-10', '2025-08-12']);
  });

  it('says what the date waits for, or what went wrong', async () => {
    const notes: Record<MapDateView['status'], string> = {
      ready: 'Photos taken on 2025-08-10',
      loading: 'Loading the dates...',
      failed: 'The dates could not be loaded.',
      zoomIn: 'Zoom in to see when the imagery was taken.',
    };
    for (const [status, note] of Object.entries(notes)) {
      await show({ ...wayback, status: status as MapDateView['status'] });
      // Without the spaces of the template around it.
      expect(element.querySelector('.plm-leaflet-map-date-note').textContent).toBe(note);
      // A spinner while the dates load, before the note, which a screen reader skips, as the note says the same.
      const spinner = element.querySelector('.plm-leaflet-map-date-note > mat-spinner:first-child');
      expect(spinner !== null).toBe(status === 'loading');
      expect(spinner?.getAttribute('aria-hidden') ?? 'true').toBe('true');
    }
    await show({ ...wayback, photoDates: null });
    expect(text('.plm-leaflet-map-date-note')).toBe('No photo on the map has a date taken.');
    // Nothing to choose from, as when zoomed out: the release shown.
    await show({ ...wayback, choices: [], chosenRelease: null, date: '2026-11-18', canGoEarlier: false, canGoLater: false });
    expect(select()).toBeNull();
    expect(text('.plm-leaflet-map-date-value')).toBe('Version of 2026-11-18');
    expect(button('earlier').disabled).toBe(true);
  });

  it('tells which date was chosen, by a button, the list or the box', async () => {
    const said: string[] = [];
    fixture.componentInstance.earlier.subscribe(() => said.push('earlier'));
    fixture.componentInstance.later.subscribe(() => said.push('later'));
    fixture.componentInstance.choose.subscribe(release => said.push(`choose ${release}`));
    fixture.componentInstance.matchPhotoDatesChange.subscribe(match => said.push(`match ${match}`));
    await show(wayback);

    button('earlier').click();
    button('later').click();
    select().value = '52930';
    select().dispatchEvent(new Event('change'));
    element.querySelector<HTMLInputElement>('mat-checkbox input').click();

    expect(said).toEqual(['earlier', 'later', 'choose 52930', 'match true']);
  });
});

describe('withDates', () => {
  it('splits a sentence at its dates, in the user\'s date format, wherever the translation puts them', () => {
    expect(withDates('map.dates.photosTakenFromTo', { first: '2017-12-16', last: '2019-03-16' })).toEqual([
      { text: 'Photos taken from ', isDate: false },
      { text: '2017-12-16', isDate: true },
      { text: ' to ', isDate: false },
      { text: '2019-03-16', isDate: true },
    ]);
    expect(withDates('map.dates.photosTakenOn', { date: '2025-08-10' })).toEqual([
      { text: 'Photos taken on ', isDate: false },
      { text: '2025-08-10', isDate: true },
    ]);
  });
});
