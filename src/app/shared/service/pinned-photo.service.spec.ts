import { TestBed } from '@angular/core/testing';
import moment from 'moment';
import { DateTimeTakenChartConfigService } from '../../date-time-taken-chart/config/date-time-taken-chart-config.service';
import { DateTimeOriginal } from '../model/date-time-original';
import { Exif } from '../model/exif.model';
import { Photo } from '../model/photo.model';
import { PinnedPhotoService } from './pinned-photo.service';
import { SelectedPhotoService } from './selected-photo.service';

/** A photo taken at the moment given, or with no shooting time without one. */
function photo(name: string, takenAt?: string): Photo {
  const exif = Object.assign(new Exif(), takenAt ? { dateTimeOriginal: new DateTimeOriginal(moment(takenAt)) } : {});
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension: '.jpg', exif });
}

const names = (photos: readonly Photo[]) => photos.map(photo => photo.name);

describe('PinnedPhotoService', () => {
  let service: PinnedPhotoService;
  let selectedPhotoService: SelectedPhotoService;
  let chartConfigService: DateTimeTakenChartConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PinnedPhotoService);
    selectedPhotoService = TestBed.inject(SelectedPhotoService);
    chartConfigService = TestBed.inject(DateTimeTakenChartConfigService);
  });

  it('pins the selected photos that the chart lets through, and gives a copy of them', () => {
    selectedPhotoService.setSelectedPhotos([photo('2013.jpg', '2013-12-18T15:43:34'), photo('unknown.jpg'),
      photo('2019.jpg', '2019-03-16T17:29:58')]);
    expect(names(service.pinnedPhotos())).toEqual(['2013.jpg', 'unknown.jpg', '2019.jpg']);

    chartConfigService.setXAxisUnit('year');
    chartConfigService.zoom(['2019']);
    expect(names(service.pinnedPhotos())).toEqual(['2019.jpg']);

    const copy = service.getPinnedPhotos();
    copy.pop();
    expect(service.pinnedPhotos()).toHaveLength(1);
  });

  it('keeps the photos that it has while the same ones are pinned, so that the maps do not render again', () => {
    selectedPhotoService.setSelectedPhotos([photo('a.jpg', '2019-03-16T17:29:58'), photo('b.jpg', '2019-05-01T00:00:00')]);
    const pinned = service.pinnedPhotos();

    // A zoom on the year that both photos were taken in pins them both again.
    chartConfigService.setXAxisUnit('year');
    chartConfigService.zoom(['2019']);

    expect(service.pinnedPhotos()).toBe(pinned);
  });
});
