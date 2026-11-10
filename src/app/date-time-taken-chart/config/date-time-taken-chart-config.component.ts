import { Component, computed, output, inject } from '@angular/core';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { DomSanitizer } from '@angular/platform-browser';
import { unitOfTime } from 'moment';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { SelectedPhotoService } from '../../shared/service/selected-photo.service';
import { dateTimeTakenChartLogger as logger } from '../date-time-taken-chart-logger';
import { DateTimeTakenChartConfigService } from './date-time-taken-chart-config.service';
import { xAxisUnits } from './date-time-taken-chart-x-axis-unit';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss'],
  imports: [MatMenuTrigger, MatMenu, MatCheckbox, FormsModule, TranslatePipe]
})
export class DateTimeTakenChartConfigComponent {
  public chartConfigService = inject(DateTimeTakenChartConfigService);
  private sanitizer = inject(DomSanitizer);
  private selectedPhotoService = inject(SelectedPhotoService);

  public readonly xAxisUnits = xAxisUnits;

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

  /** The select's value is the unit as moment names it; its text is the unit's name in the application's language. */
  public onXAxisSelectChange(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const xAxisUnitMomentJsStr = xAxisUnits.find(unit => unit.momentJsStr === selectedValue)?.momentJsStr;
    if (!xAxisUnitMomentJsStr)
      return;
    logger.info(`Changed DTT Chart X-axis unit to "${xAxisUnitMomentJsStr}".`);
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Changed X-axis unit`, `Changed DTT Chart X-axis unit to "${xAxisUnitMomentJsStr}"`);
    this.xAxisUnitChange.emit(xAxisUnitMomentJsStr);
  }
}
