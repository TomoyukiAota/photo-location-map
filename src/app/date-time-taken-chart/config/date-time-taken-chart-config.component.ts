import { Component, computed, output, inject } from '@angular/core';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { DomSanitizer } from '@angular/platform-browser';
import { unitOfTime } from 'moment';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { dateTimeTakenChartLogger as logger } from '../date-time-taken-chart-logger';
import { DateTimeTakenChartConfigService } from './date-time-taken-chart-config.service';
import { getXAxisUnitMomentJsStr, xAxisUnit } from './date-time-taken-chart-x-axis-unit';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss'],
  imports: [MatMenuTrigger, MatMenu, MatCheckbox, FormsModule]
})
export class DateTimeTakenChartConfigComponent {
  public chartConfigService = inject(DateTimeTakenChartConfigService);
  private sanitizer = inject(DomSanitizer);
  private selectedPhotoService = inject(SelectedPhotoService);

  public xAxisUnits = [
    xAxisUnit.year.displayStr,
    xAxisUnit.month.displayStr,
    xAxisUnit.day.displayStr,
    xAxisUnit.hour.displayStr,
    xAxisUnit.minute.displayStr,
    xAxisUnit.second.displayStr,
  ];

  public readonly dateUnknownPhotosCount = computed(() =>
    this.selectedPhotoService.selectedPhotos().filter(photo => !photo.exif?.dateTimeOriginal).length);
  /** The checkbox for the photos without a shooting time changed; the chart pins or unpins them. */
  public readonly showDateUnknownPhotosChange = output<boolean>();
  /** The unit of the x-axis changed; the chart draws again with it and pins every selected photo. */
  public readonly xAxisUnitChange = output<unitOfTime.DurationConstructor>();

  public get moreOptionsIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.moreOptions); }

  public onShowDateUnknownPhotosCheckboxChanged(event: MatCheckboxChange) {
    const showDateUnknownPhotos = event.checked;
    logger.info(`Clicked "Show date-unknown photos" checkbox. Changed to "${showDateUnknownPhotos}".`);
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Clicked "Show date-unknown"`, `Changed "Show date-unknown photos" to "${showDateUnknownPhotos}"`);
    this.showDateUnknownPhotosChange.emit(showDateUnknownPhotos);
  }

  public onXAxisSelectChange(event: any) {
    const xAxisUnitDisplayStr = event.target.value;
    const xAxisUnitMomentJsStr = getXAxisUnitMomentJsStr(xAxisUnitDisplayStr);
    logger.info(`Changed DTT Chart X-axis unit to "${xAxisUnitMomentJsStr}".`);
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Changed X-axis unit`, `Changed DTT Chart X-axis unit to "${xAxisUnitMomentJsStr}"`);
    this.xAxisUnitChange.emit(xAxisUnitMomentJsStr);
  }
}
