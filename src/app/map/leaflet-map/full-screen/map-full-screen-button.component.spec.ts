import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapFullScreenButtonComponent } from './map-full-screen-button.component';
import { MapFullScreenService } from './map-full-screen.service';

describe('MapFullScreenButtonComponent', () => {
  let fixture: ComponentFixture<MapFullScreenButtonComponent>;
  let service: MapFullScreenService;

  const button = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.plm-leaflet-map-full-screen-button');
  const iconPath = () => button().querySelector('svg path').getAttribute('d');

  beforeEach(async () => {
    fixture = TestBed.createComponent(MapFullScreenButtonComponent);
    service = TestBed.inject(MapFullScreenService);
    await fixture.whenStable();
  });

  it('puts the map in full screen, and takes it out, saying which it does', async () => {
    expect(button().type).toBe('button');
    expect([button().title, button().getAttribute('aria-label')]).toEqual(['Full Screen', 'Full Screen']);
    const enterIcon = iconPath();

    button().click();
    await fixture.whenStable();
    expect(service.on()).toBe(true);
    expect([button().title, button().getAttribute('aria-label')]).toEqual(['Exit Full Screen', 'Exit Full Screen']);
    expect(iconPath()).not.toBe(enterIcon);

    button().click();
    await fixture.whenStable();
    expect(service.on()).toBe(false);
    expect(button().title).toBe('Full Screen');
    expect(iconPath()).toBe(enterIcon);
  });

  it('follows the map\'s full screen, however it is entered and left', async () => {
    service.enter('menu');
    await fixture.whenStable();
    expect(button().title).toBe('Exit Full Screen');

    service.leave('escape');
    await fixture.whenStable();
    expect(button().title).toBe('Full Screen');
  });
});
