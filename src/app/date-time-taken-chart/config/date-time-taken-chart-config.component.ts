import { Component, EventEmitter, Output } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DomSanitizer } from '@angular/platform-browser';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { DateTimeTakenChartConfigService } from './date-time-taken-chart-config.service';
import { xAxisUnit } from './x-axis-unit';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss']
})
export class DateTimeTakenChartConfigComponent {
  public xAxisUnits = [xAxisUnit.day.displayStr, xAxisUnit.month.displayStr, xAxisUnit.year.displayStr];
  @Output() xAxisUnitChanged = new EventEmitter<string>;

  constructor(public chartConfigService: DateTimeTakenChartConfigService,
              private sanitizer: DomSanitizer) {
  }

  public get settingsIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.settingsIcon); }

  public onShowDateUnknownPhotosCheckboxChanged(event: MatCheckboxChange) {
    this.chartConfigService.showDateUnknownPhotos.next(event.checked);
  }

  public onXAxisSelectChange(event: any) {
    const xAxisUnitDisplayStr = event.target.value;
    this.xAxisUnitChanged.emit(xAxisUnitDisplayStr);
  }
}
