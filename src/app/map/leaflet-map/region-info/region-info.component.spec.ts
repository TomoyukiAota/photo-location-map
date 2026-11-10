import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegionInfoComponent } from './region-info.component';

describe('RegionInfoComponent', () => {
  let fixture: ComponentFixture<RegionInfoComponent>;
  let element: HTMLElement;

  const text = () => element.querySelector('.plm-leaflet-map-region-info-text').textContent;
  const button = () => element.querySelector<HTMLButtonElement>('button.plm-leaflet-map-region-info-select-photos-button');

  async function show(photoCount: number): Promise<void> {
    fixture.componentRef.setInput('photoCount', photoCount);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(RegionInfoComponent);
    element = fixture.nativeElement;
  });

  it('says how many photos are within the regions, and has no photos to select when there are none', async () => {
    await show(0);

    expect(element.classList.contains('plm-leaflet-map-region-info-container')).toBe(true);
    expect(text()).toBe('Photos in Regions: 0');
    expect(button().textContent).toBe('Select Photos');
    expect(button().disabled).toBe(true);
  });

  it('follows the number of photos, and tells that its button was clicked', async () => {
    const selectPhotos = vi.fn();
    fixture.componentInstance.selectPhotos.subscribe(selectPhotos);
    await show(0);

    await show(3);
    expect(text()).toBe('Photos in Regions: 3');
    expect(button().disabled).toBe(false);
    button().click();

    expect(selectPhotos).toHaveBeenCalledTimes(1);
  });
});
