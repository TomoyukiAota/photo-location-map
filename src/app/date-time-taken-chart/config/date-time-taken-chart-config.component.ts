import { Component, EventEmitter, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IconDataUrl } from '../../../assets/icon-data-url';
import { xAxisUnit } from './x-axis-unit';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss']
})
export class DateTimeTakenChartConfigComponent {
  public xAxisUnits = [xAxisUnit.day.displayStr, xAxisUnit.month.displayStr, xAxisUnit.year.displayStr];
  @Output() xAxisUnitChanged = new EventEmitter<string>;

  constructor(private sanitizer: DomSanitizer) {
  }

  public get settingsIconDataUrl() { return this.sanitizer.bypassSecurityTrustResourceUrl(IconDataUrl.settingsIcon); }
  
  public handleSettingsIconClicked() {
    console.log('handleSettingsIconClicked called');
  }

  public onXAxisSelectChange(event: any) {
    const xAxisUnitDisplayStr = event.target.value;
    this.xAxisUnitChanged.emit(xAxisUnitDisplayStr);
  }
}
