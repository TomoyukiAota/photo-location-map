import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DomSanitizer } from '@angular/platform-browser';
import { map, Observable } from 'rxjs';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { dateTimeTakenChartLogger as logger } from '../date-time-taken-chart-logger';
import { DateTimeTakenChartConfigService } from './date-time-taken-chart-config.service';
import { getXAxisUnitMomentJsStr, xAxisUnit } from './date-time-taken-chart-x-axis-unit';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss']
})
export class DateTimeTakenChartConfigComponent {
  public xAxisUnits = [xAxisUnit.hour.displayStr, xAxisUnit.day.displayStr, xAxisUnit.month.displayStr, xAxisUnit.year.displayStr];
  public dateUnknownPhotosCount: Observable<number>;

  constructor(public chartConfigService: DateTimeTakenChartConfigService,
              private sanitizer: DomSanitizer,
              private selectedPhotoService: SelectedPhotoService) {
    this.dateUnknownPhotosCount = selectedPhotoService.selectedPhotos
      .pipe(map(photos => {
        const dateUnknownPhotos = photos.filter(photo => !photo.exif?.dateTimeOriginal);
        return dateUnknownPhotos.length;
      }));
  }

  public get settingsIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.moreOptions); }

  public onShowDateUnknownPhotosCheckboxChanged(event: MatCheckboxChange) {
    const showDateUnknownPhotos = event.checked;
    logger.info(`Clicked "Show date-unknown photos". Changed to "${showDateUnknownPhotos}"`);
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Clicked "Show date-unknown"`, `Changed "Show date-unknown photos" to "${showDateUnknownPhotos}"`);
    this.chartConfigService.showDateUnknownPhotos.next(showDateUnknownPhotos);
  }

  public onXAxisSelectChange(event: any) {
    const xAxisUnitDisplayStr = event.target.value;
    const xAxisUnitMomentJsStr = getXAxisUnitMomentJsStr(xAxisUnitDisplayStr);
    logger.info(`Changed DTT Chart X-axis unit to "${xAxisUnitMomentJsStr}"`);
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Changed X-axis unit`, `Changed DTT Chart X-axis unit to "${xAxisUnitMomentJsStr}"`);
    this.chartConfigService.xAxisUnitMomentJsStr.next(xAxisUnitMomentJsStr);
  }
}
