import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, signal, viewChildren } from '@angular/core';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Photo } from '../../../shared/model/photo.model';

const photosPerBatch = 50;

/** The photos that can be chosen where individual markers overlap on the map. */
@Component({
  selector: 'app-overlapping-photo-picker',
  templateUrl: './overlapping-photo-picker.component.html',
  styleUrl: './overlapping-photo-picker.component.scss',
  imports: [TranslatePipe],
  host: {
    '(keydown.escape)': 'dismissPicker($event)',
  },
})
export class OverlappingPhotoPickerComponent {
  public readonly photos = input.required<readonly Photo[]>();
  public readonly choosePhoto = input.required<(photo: Photo) => void>();
  public readonly dismiss = input.required<() => void>();

  private readonly injector = inject(Injector);
  private readonly photoButtons = viewChildren<ElementRef<HTMLButtonElement>>('photoButton');
  private readonly shownCount = signal(photosPerBatch);
  protected readonly shownPhotos = computed(() => this.photos().slice(0, this.shownCount()));
  protected readonly hasMorePhotos = computed(() => this.photos().length > this.shownCount());

  /** Distinguishes photos from different folders that have the same file name. */
  protected readonly repeatedNames = computed(() => {
    const names = new Set<string>();
    const repeated = new Set<string>();
    for (const photo of this.photos()) {
      if (names.has(photo.name))
        repeated.add(photo.name);
      names.add(photo.name);
    }
    return repeated;
  });

  protected showMorePhotos(): void {
    const firstNewPhoto = this.shownCount();
    this.shownCount.update(count => count + photosPerBatch);
    afterNextRender({
      write: () => this.photoButtons()[firstNewPhoto]?.nativeElement.focus(),
    }, { injector: this.injector });
  }

  protected selectPhoto(event: Event, photo: Photo): void {
    // Choosing removes the picker from the map during the click. Keep that click from closing the new popup.
    event.stopPropagation();
    this.choosePhoto()(photo);
  }

  protected dismissPicker(event: Event): void {
    event.stopPropagation();
    this.dismiss()();
  }
}
