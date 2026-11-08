import { TestBed } from '@angular/core/testing';
import { Photo } from '../../shared/model/photo.model';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { DateTimeTakenChartConfigService } from './date-time-taken-chart-config.service';

function photo(name: string): Photo {
  return Object.assign(new Photo(), { name, path: `/photos/${name}`, filenameExtension: '.jpg', exif: null });
}

describe('DateTimeTakenChartConfigService', () => {
  let service: DateTimeTakenChartConfigService;
  let selectedPhotoService: SelectedPhotoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateTimeTakenChartConfigService);
    selectedPhotoService = TestBed.inject(SelectedPhotoService);
  });

  it('is not zoomed, and pins the photos without a shooting time, at first', () => {
    expect(service.xValuesWithinZoom()).toBeNull();
    expect(service.showDateUnknownPhotos()).toBe(true);
  });

  it('leaves out the photos without a shooting time on a zoom, until the zoom is reset', () => {
    service.zoom(['2019']);
    expect(service.xValuesWithinZoom()).toEqual(['2019']);
    expect(service.showDateUnknownPhotos()).toBe(false);

    service.setShowDateUnknownPhotos(true);
    expect(service.xValuesWithinZoom()).toEqual(['2019']);
    expect(service.showDateUnknownPhotos()).toBe(true);

    service.setShowDateUnknownPhotos(false);
    service.resetZoom();
    expect(service.xValuesWithinZoom()).toBeNull();
    expect(service.showDateUnknownPhotos()).toBe(true);
  });

  it('ends the zoom, and pins the photos without a shooting time again, when other photos are selected', () => {
    selectedPhotoService.setSelectedPhotos([photo('a.jpg')]);
    service.zoom(['2019']);

    // The same photos again do not change the selection, so the chart does not draw again.
    selectedPhotoService.setSelectedPhotos([photo('a.jpg')]);
    expect(service.xValuesWithinZoom()).toEqual(['2019']);
    expect(service.showDateUnknownPhotos()).toBe(false);

    selectedPhotoService.setSelectedPhotos([photo('b.jpg')]);
    expect(service.xValuesWithinZoom()).toBeNull();
    expect(service.showDateUnknownPhotos()).toBe(true);
  });

  it('ends the zoom, and pins the photos without a shooting time again, when the unit of the x-axis changes', () => {
    service.zoom(['2019']);
    service.setXAxisUnit('year');

    expect(service.xAxisUnit()).toBe('year');
    expect(service.xValuesWithinZoom()).toBeNull();
    expect(service.showDateUnknownPhotos()).toBe(true);
  });
});
