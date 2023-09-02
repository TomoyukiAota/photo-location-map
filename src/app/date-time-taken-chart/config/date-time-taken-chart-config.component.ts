import { Component, EventEmitter, Output } from '@angular/core';
import { xAxisUnit } from './x-axis-unit';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss']
})
export class DateTimeTakenChartConfigComponent {
  public xAxisUnits = [xAxisUnit.day.displayStr, xAxisUnit.month.displayStr, xAxisUnit.year.displayStr];
  @Output() xAxisUnitChanged = new EventEmitter<string>;

  public onXAxisSelectChange(event: any) {
    const xAxisUnitDisplayStr = event.target.value;
    this.xAxisUnitChanged.emit(xAxisUnitDisplayStr);
  }
}
