import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss']
})
export class DateTimeTakenChartConfigComponent {
  public xAxisUnits: string[] = ['Day', 'Month', 'Year'];
  @Output() xAxisUnitChanged = new EventEmitter<string>;

  public onXAxisSelectChange(event: any) {
    this.xAxisUnitChanged.emit(event.target.value);
  }
}
