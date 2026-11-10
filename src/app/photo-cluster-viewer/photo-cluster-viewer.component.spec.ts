import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateTimeOriginal } from '../shared/model/date-time-original';
import { Photo } from '../shared/model/photo.model';
import { OpenedDirectory } from '../shared/opened-directory';
import { ThumbnailRotationService } from '../photo-info-viewer/thumbnail-rotation.service';
import { PhotoClusterViewerComponent, sortByShootingTime } from './photo-cluster-viewer.component';

/** A JPEG photo of this name, taken at the hour given of one day, or at an unknown time. */
function photo(name: string, hour?: number): Photo {
  const exif = hour === undefined ? {} : { dateTimeOriginal: new DateTimeOriginal(new Date(2019, 2, 16, hour, 0, 0)) };
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension: '.jpg', exif });
}

describe('sortByShootingTime', () => {
  it('puts the photos in the order of their shooting times, then those without one by their names', () => {
    const photos = [photo('d.jpg'), photo('late.jpg', 20), photo('b.jpg'), photo('early.jpg', 8), photo('noon.jpg', 12)];

    expect(sortByShootingTime(photos).map(each => each.name)).toEqual(['early.jpg', 'noon.jpg', 'late.jpg', 'b.jpg', 'd.jpg']);
    // The photos that it was given stay in their order.
    expect(photos.map(each => each.name)).toEqual(['d.jpg', 'late.jpg', 'b.jpg', 'early.jpg', 'noon.jpg']);
  });
});

describe('PhotoClusterViewerComponent', () => {
  let fixture: ComponentFixture<PhotoClusterViewerComponent>;
  let element: HTMLElement;
  let livePhotos: ReturnType<typeof vi.spyOn>;

  const tiles = () => Array.from(element.querySelectorAll<HTMLElement>('.photo-cluster-viewer-left-pane > .photo-cluster-viewer-tile'));
  const selectedTiles = () => tiles().filter(tile => tile.classList.contains('selected-tile'));
  const timeOf = (tile: HTMLElement) => tile.querySelector('.photo-info-viewer-date-time-taken > div:last-child').textContent;
  const shownPhoto = () => element.querySelector<HTMLElement>('.photo-cluster-viewer-right-pane > app-photo-info-viewer');
  const shownName = () => shownPhoto().querySelector('.photo-info-viewer-name').textContent;

  beforeEach(async () => {
    // The opened folder is a stand-in here (test/angular/directory-double.ts), which knows of no Live Photos.
    livePhotos = vi.spyOn(OpenedDirectory, 'getLivePhotosFilePathIfAvailable').mockReturnValue({ livePhotosAvailable: false, livePhotosFilePath: '' });
    fixture = TestBed.createComponent(PhotoClusterViewerComponent);
    fixture.componentRef.setInput('photos', [photo('late.jpg', 20), photo('early.jpg', 8), photo('noon.jpg', 12)]);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => livePhotos.mockRestore());

  it('shows a tile for each photo in the order of their shooting times, with the first one chosen and shown beside them', () => {
    expect(element.classList.contains('photo-cluster-viewer-root')).toBe(true);
    expect(tiles().map(timeOf)).toEqual(['08:00:00', '12:00:00', '20:00:00']);
    expect(tiles().map(tile => tile.getAttribute('data-place'))).toEqual(['leaflet-map-tile', 'leaflet-map-tile', 'leaflet-map-tile']);
    expect(selectedTiles()).toEqual([tiles()[0]]);
    expect(shownPhoto().getAttribute('data-place')).toBe('leaflet-map-popup');
    expect(shownName()).toBe('early.jpg');
  });

  it('chooses the tile that is clicked, and shows its photo in a component of its own', async () => {
    const shownFirst = shownPhoto();

    tiles()[2].querySelector<HTMLElement>('.photo-info-viewer-thumbnail').click();
    await fixture.whenStable();

    expect(selectedTiles()).toEqual([tiles()[2]]);
    expect(shownName()).toBe('late.jpg');
    // Not the component of the first photo with another photo: its thumbnail would turn from the first one's angle.
    expect(shownPhoto()).not.toBe(shownFirst);
    expect(element.querySelectorAll('.photo-cluster-viewer-right-pane > app-photo-info-viewer')).toHaveLength(1);
  });

  it('turns a tile\'s thumbnail with the tile\'s small button, without choosing the tile, and apart from the photo shown beside', async () => {
    tiles()[1].querySelector<HTMLElement>('.photo-info-viewer-rotate-button-in-thumbnail-container').click();
    await fixture.whenStable();

    expect(tiles()[1].querySelector<HTMLElement>('.photo-info-viewer-thumbnail').style.transform).toBe('rotate(90deg)');
    expect(selectedTiles()).toEqual([tiles()[0]]);
    const rotations = TestBed.inject(ThumbnailRotationService);
    expect(rotations.degreesOf('leaflet-map-tile', '/photos/noon.jpg')).toBe(90);
    expect(rotations.degreesOf('leaflet-map-popup', '/photos/noon.jpg')).toBe(0);
  });

  it('starts over when it is given its photos again, as when its popup is opened again: the first tile, at the top', async () => {
    tiles()[1].click();
    await fixture.whenStable();
    expect(shownName()).toBe('noon.jpg');
    const tilesBefore = tiles();
    const pane = element.querySelector('.photo-cluster-viewer-left-pane');
    pane.scrollTop = 120;

    fixture.componentRef.setInput('photos', [photo('late.jpg', 20), photo('early.jpg', 8), photo('noon.jpg', 12)]);
    await fixture.whenStable();

    expect(selectedTiles()).toEqual([tiles()[0]]);
    expect(shownName()).toBe('early.jpg');
    expect(pane.scrollTop).toBe(0);
    // The tiles of the same photos are the same elements.
    expect(tiles()).toEqual(tilesBefore);
  });
});
