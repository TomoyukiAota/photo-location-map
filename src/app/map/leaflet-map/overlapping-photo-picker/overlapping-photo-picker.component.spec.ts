import { TestBed } from '@angular/core/testing';
import { Photo } from '../../../shared/model/photo.model';
import { OverlappingPhotoPickerComponent } from './overlapping-photo-picker.component';

describe('OverlappingPhotoPickerComponent', () => {
  const photo = (path: string): Photo => Object.assign(new Photo(), { path, name: path.split('/').at(-1) });

  async function show(photos: Photo[]) {
    const fixture = TestBed.createComponent(OverlappingPhotoPickerComponent);
    const choosePhoto = vi.fn();
    const dismiss = vi.fn();
    fixture.componentRef.setInput('photos', photos);
    fixture.componentRef.setInput('choosePhoto', choosePhoto);
    fixture.componentRef.setInput('dismiss', dismiss);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, choosePhoto, dismiss };
  }

  it('uses the path to distinguish same-named photos and responds to choosing one or pressing Escape', async () => {
    const second = photo('/second/image.jpg');
    const { element, choosePhoto, dismiss } = await show([photo('/first/image.jpg'), second]);
    const buttons = element.querySelectorAll('li button');
    expect(buttons[0].textContent).toContain('/first/image.jpg');
    expect(buttons[1].textContent).toContain('/second/image.jpg');

    (buttons[1] as HTMLButtonElement).click();
    expect(choosePhoto).toHaveBeenCalledWith(second);
    buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('shows large lists in batches and focuses the first newly shown photo', async () => {
    const photos = Array.from({ length: 51 }, (_, index) => photo(`/photos/image-${index}.jpg`));
    const { fixture, element } = await show(photos);
    expect(element.querySelectorAll('li button')).toHaveLength(50);

    element.querySelector<HTMLButtonElement>('.more-photos').click();
    await fixture.whenStable();

    expect(element.querySelectorAll('li button')).toHaveLength(51);
    expect(element.querySelector('.more-photos')).toBeNull();
    expect(document.activeElement).toBe(element.querySelectorAll('li button')[50]);
  });
});
