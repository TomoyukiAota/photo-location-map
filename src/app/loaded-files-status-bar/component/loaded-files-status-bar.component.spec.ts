import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Exif } from '../../shared/model/exif.model';
import { GpsInfo } from '../../shared/model/gps-info.model';
import { Photo } from '../../shared/model/photo.model';
import { PhotoDataService } from '../../shared/service/photo-data.service';
import { LoadedFilesStatusBarComponent } from './loaded-files-status-bar.component';

/** A photo of the given file name in /photos, with location data when withLocation is true. */
function photo(name: string, withLocation = false): Photo {
  const exif = withLocation ? Object.assign(new Exif(), { gpsInfo: new GpsInfo() }) : null;
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension: name.slice(name.lastIndexOf('.')), exif });
}

describe('LoadedFilesStatusBarComponent', () => {
  const photos = signal<readonly Photo[]>([]);
  let fixture: ComponentFixture<LoadedFilesStatusBarComponent>;
  const text = () => (fixture.nativeElement as HTMLElement).textContent.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    photos.set([]);
    await TestBed.configureTestingModule({
      declarations: [LoadedFilesStatusBarComponent],
      providers: [{ provide: PhotoDataService, useValue: { photos } }],
    }).compileComponents();
    fixture = TestBed.createComponent(LoadedFilesStatusBarComponent);
    await fixture.whenStable();
  });

  it('shows nothing before a folder is loaded', () => {
    expect(text()).toBe('');
  });

  it('shows the counts as soon as the photos change, without being asked to', async () => {
    photos.set([photo('a.jpg', true), photo('b.heic')]);
    await fixture.whenStable();

    expect(text()).toContain('Loaded 2 files.');
    expect(text()).toContain('1 files have location data.');
    expect(text()).toContain('JPEG: 1 / HEIF: 1 / Total: 2');
  });
});
